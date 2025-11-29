import { Response } from "express";
import { prisma } from "../db";
import { AuthRequest } from "../middleware/auth.middleware";
import { sendErrorResponse } from "../utils/errorResponse";
import { validateTeamInvitation } from "../validators/teamInvitation.validator";
import { sendEmail } from "../services/email";
import crypto from "crypto";

const INVITATION_EXPIRY_DAYS = 7;

export const createInvitation = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { teamId } = req.params;
    const validationErrors = validateTeamInvitation(req.body);

    if (validationErrors.length > 0) {
      sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "Invalid input data",
        validationErrors
      );
      return;
    }

    const { email, role } = req.body;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        owner: {
          select: { firstName: true, lastName: true },
        },
        members: {
          where: { isActive: true },
        },
      },
    });

    if (!team) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Team not found");
      return;
    }

    if (team.maxMembers && team.members.length >= team.maxMembers) {
      sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "Team has reached maximum member capacity"
      );
      return;
    }

    const existingUser = await prisma.userProfile.findFirst({
      where: { email },
    });

    if (existingUser) {
      const existingMember = await prisma.teamMember.findFirst({
        where: {
          teamId,
          userId: existingUser.userId,
          isActive: true,
        },
      });

      if (existingMember) {
        sendErrorResponse(
          res,
          400,
          "VALIDATION_ERROR",
          "User is already a member of this team"
        );
        return;
      }
    }

    const existingInvite = await prisma.teamInvitation.findFirst({
      where: {
        teamId,
        email,
        status: "pending",
      },
    });

    if (existingInvite) {
      sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "A pending invitation already exists for this email"
      );
      return;
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

    const invitation = await prisma.teamInvitation.create({
      data: {
        teamId,
        email,
        role: role || "member",
        invitedBy: userId,
        token,
        expiresAt,
      },
      include: {
        team: true,
        inviter: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    const inviterName = `${invitation.inviter.firstName || ""} ${invitation.inviter.lastName || ""}`.trim() || "Someone";
    const acceptUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/team-invitations/accept/${token}`;

    try {
      await sendEmail({
        to: email,
        subject: `You're invited to join ${team.name}`,
        text: `${inviterName} has invited you to join the team "${team.name}".\n\nAccept the invitation by clicking this link:\n${acceptUrl}\n\nThis invitation expires in ${INVITATION_EXPIRY_DAYS} days.`,
        html: `
          <h2>Team Invitation</h2>
          <p><strong>${inviterName}</strong> has invited you to join the team <strong>${team.name}</strong>.</p>
          <p><a href="${acceptUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Accept Invitation</a></p>
          <p>Or copy and paste this link into your browser:</p>
          <p>${acceptUrl}</p>
          <p><small>This invitation expires in ${INVITATION_EXPIRY_DAYS} days.</small></p>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send invitation email:", emailError);
    }

    res.status(201).json(invitation);
  } catch (error) {
    console.error("Error creating invitation:", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to create invitation"
    );
  }
};

export const getTeamInvitations = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { teamId } = req.params;

    const invitations = await prisma.teamInvitation.findMany({
      where: { teamId },
      include: {
        inviter: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(invitations);
  } catch (error) {
    console.error("Error fetching invitations:", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to fetch invitations"
    );
  }
};

export const getMyInvitations = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;

    const user = await prisma.userProfile.findUnique({
      where: { userId },
      select: { email: true },
    });

    if (!user || !user.email) {
      res.json([]);
      return;
    }

    const invitations = await prisma.teamInvitation.findMany({
      where: {
        email: user.email,
        status: "pending",
        expiresAt: {
          gte: new Date(),
        },
      },
      include: {
        team: {
          include: {
            owner: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        inviter: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(invitations);
  } catch (error) {
    console.error("Error fetching my invitations:", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to fetch invitations"
    );
  }
};

export const acceptInvitation = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { inviteId } = req.params;

    const invitation = await prisma.teamInvitation.findUnique({
      where: { id: inviteId },
      include: { team: true },
    });

    if (!invitation) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Invitation not found");
      return;
    }

    const user = await prisma.userProfile.findUnique({
      where: { userId },
      select: { email: true },
    });

    if (!user || user.email !== invitation.email) {
      sendErrorResponse(
        res,
        403,
        "FORBIDDEN",
        "This invitation is not for your email address"
      );
      return;
    }

    if (invitation.status !== "pending") {
      sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        `Invitation has already been ${invitation.status}`
      );
      return;
    }

    if (invitation.expiresAt < new Date()) {
      await prisma.teamInvitation.update({
        where: { id: inviteId },
        data: { status: "expired" },
      });
      sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "Invitation has expired"
      );
      return;
    }

    const existingMember = await prisma.teamMember.findFirst({
      where: {
        teamId: invitation.teamId,
        userId,
        isActive: true,
      },
    });

    if (existingMember) {
      await prisma.teamInvitation.update({
        where: { id: inviteId },
        data: { status: "accepted", acceptedAt: new Date() },
      });
      sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "You are already a member of this team"
      );
      return;
    }

    const [member] = await prisma.$transaction([
      prisma.teamMember.create({
        data: {
          teamId: invitation.teamId,
          userId,
          role: invitation.role,
        },
        include: {
          team: true,
          user: {
            select: {
              userId: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      prisma.teamInvitation.update({
        where: { id: inviteId },
        data: { status: "accepted", acceptedAt: new Date() },
      }),
    ]);

    res.json(member);
  } catch (error) {
    console.error("Error accepting invitation:", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to accept invitation"
    );
  }
};

export const declineInvitation = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { inviteId } = req.params;

    const invitation = await prisma.teamInvitation.findUnique({
      where: { id: inviteId },
    });

    if (!invitation) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Invitation not found");
      return;
    }

    const user = await prisma.userProfile.findUnique({
      where: { userId },
      select: { email: true },
    });

    if (!user || user.email !== invitation.email) {
      sendErrorResponse(
        res,
        403,
        "FORBIDDEN",
        "This invitation is not for your email address"
      );
      return;
    }

    await prisma.teamInvitation.update({
      where: { id: inviteId },
      data: { status: "declined" },
    });

    res.json({ message: "Invitation declined" });
  } catch (error) {
    console.error("Error declining invitation:", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to decline invitation"
    );
  }
};

export const cancelInvitation = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { teamId, inviteId } = req.params;

    const invitation = await prisma.teamInvitation.findUnique({
      where: { id: inviteId },
    });

    if (!invitation || invitation.teamId !== teamId) {
      sendErrorResponse(res, 404, "NOT_FOUND", "Invitation not found");
      return;
    }

    await prisma.teamInvitation.delete({
      where: { id: inviteId },
    });

    res.json({ message: "Invitation cancelled" });
  } catch (error) {
    console.error("Error cancelling invitation:", error);
    sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to cancel invitation"
    );
  }
};
