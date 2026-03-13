import { notificationRepository } from "../repositories/notificationRepository.js";
import { userRepository } from "../repositories/userRepository.js";

export const notificationService = {
  async notifyByRoles(roles, payload) {
    const usersByRole = await Promise.all(roles.map((role) => userRepository.findByRole(role)));
    const userIds = [...new Set(usersByRole.flat().map((u) => u.id))];
    return notificationRepository.createMany(userIds, payload);
  },

  async notifyUsers(userIds, payload) {
    const deduped = [...new Set(userIds.filter(Boolean))];
    return notificationRepository.createMany(deduped, payload);
  },

  async myNotifications(userId) {
    return notificationRepository.listByUserId(userId);
  },
};
