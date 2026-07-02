import api from './Api';

/**
 * Room Deletion Service
 * Handles safe room deletion with booking validation
 */
export const roomDeletionService = {
  /**
   * Check if a room can be safely deleted
   * @param {number} roomId - The ID of the room to check
   * @returns {Promise<Object>} Deletion status response
   */
  async checkDeletionStatus(roomId) {
    try {
      const response = await api.get(`/rooms/${roomId}/deletion-status`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to check deletion status',
        data: null
      };
    }
  },

  /**
   * Delete a room (should only be called after checking deletion status)
   * @param {number} roomId - The ID of the room to delete
   * @returns {Promise<Object>} Deletion result
   */
  async deleteRoom(roomId) {
    try {
      const response = await api.delete(`/rooms/${roomId}`);
      return {
        success: true,
        data: response.data,
        message: 'Room deleted successfully'
      };
    } catch (error) {
      
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete room',
        data: null
      };
    }
  },

  /**
   * Safe room deletion with automatic status check
   * @param {number} roomId - The ID of the room to delete
   * @returns {Promise<Object>} Complete deletion process result
   */
  async safeDeleteRoom(roomId) {
    // First check if room can be deleted
    const statusCheck = await this.checkDeletionStatus(roomId);
    
    if (!statusCheck.success) {
      return {
        success: false,
        error: statusCheck.error,
        stage: 'status_check'
      };
    }

    // If room cannot be deleted due to bookings, return the status
    if (!statusCheck.data.canDelete) {
      return {
        success: false,
        canDelete: false,
        deletionStatus: statusCheck.data,
        stage: 'validation_failed'
      };
    }

    // Room can be safely deleted, proceed with deletion
    const deleteResult = await this.deleteRoom(roomId);
    
    return {
      success: deleteResult.success,
      error: deleteResult.error,
      message: deleteResult.message,
      stage: 'deletion_complete'
    };
  }
};

export default roomDeletionService;
