const User = require('../models/User');

// Get all blocked users with enhanced error handling and attractive responses
exports.getBlockedUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        const { role, search } = req.query;
        
        // Build filter
        let filter = { isBlocked: true };
        if (role) filter.role = role;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Get blocked users
        const blockedUsers = await User.find(filter)
            .select('name email role blockReason blockExpiresAt blockedAt')
            .skip(skip)
            .limit(limit);
            
        const totalUsers = await User.countDocuments(filter);
        
        if (blockedUsers.length === 0) {
            return res.status(200).json({
                status: 'success',
                message: '🎉 No users are currently blocked in the system'
            });
        }
        
        res.status(200).json({
            status: 'success',
            message: `Found ${blockedUsers.length} blocked users`,
            data: {
                users: blockedUsers,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalUsers / limit),
                    totalUsers
                }
            }
        });
        
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch blocked users',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
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