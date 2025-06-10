const User = require('../models/User');

// Get all blocked users
exports.getBlockedUsers = async (req, res) => {
    try {
        const blockedUsers = await User.find({ isBlocked: true })
            .select('name email phone role blockReason blockExpiresAt createdAt')
            .sort({ blockExpiresAt: 1 });

        res.json({
            status: 'success',
            data: blockedUsers
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error fetching blocked users',
            error: error.message
        });
    }
};

// Unblock a user
exports.unblockUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        if (!user.isBlocked) {
            return res.status(400).json({
                status: 'error',
                message: 'User is not blocked'
            });
        }

        await user.resetLoginAttempts();

        res.json({
            status: 'success',
            message: 'User has been unblocked successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error unblocking user',
            error: error.message
        });
    }
};

// Manually block a user
exports.blockUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason, duration } = req.body; // duration in hours

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        const blockExpiresAt = new Date(Date.now() + (duration || 24) * 60 * 60 * 1000);

        await User.findByIdAndUpdate(userId, {
            isBlocked: true,
            blockReason: reason || 'Blocked by admin',
            blockExpiresAt,
            lockUntil: blockExpiresAt
        });

        res.json({
            status: 'success',
            message: 'User has been blocked successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error blocking user',
            error: error.message
        });
    }
}; 