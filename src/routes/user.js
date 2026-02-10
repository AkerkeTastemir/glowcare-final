const express = require('express');
const { User, Product } = require('../models');
const { authJWT } = require('../middleware');

const router = express.Router();

router.get('/profile', authJWT, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ message: 'Profile not found' });
        res.json(user);
    } catch (err) {
        next(err);
    }
});

router.put('/profile', authJWT, async (req, res, next) => {
    try {
        const allowed = ['username'];
        const updates = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined) updates[key] = req.body[key];
        }

        const updated = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updates },
            { new: true }
        ).select('-password');

        if (!updated) return res.status(404).json({ message: 'Profile not found' });
        res.json(updated);
    } catch (err) {
        next(err);
    }
});

router.get('/wishlist', authJWT, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).populate('wishlist');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user.wishlist);
    } catch (err) {
        next(err);
    }
});

router.post('/wishlist/:productId', authJWT, async (req, res, next) => {
    try {
        await User.findByIdAndUpdate(
            req.user.id,
            { $addToSet: { wishlist: req.params.productId } },
            { new: true }
        );
        res.json({ message: 'Added to wishlist' });
    } catch (err) {
        next(err);
    }
});

router.delete('/wishlist/:productId', authJWT, async (req, res, next) => {
    try {
        await User.findByIdAndUpdate(
            req.user.id,
            { $pull: { wishlist: req.params.productId } },
            { new: true }
        );
        res.json({ message: 'Removed from wishlist' });
    } catch (err) {
        next(err);
    }
});

router.post('/quiz', authJWT, async (req, res, next) => {
    try {
        const quizProfile = {
            skinType: req.body.skinType,
            concerns: Array.isArray(req.body.concerns) ? req.body.concerns : [],
            preferences: Array.isArray(req.body.preferences) ? req.body.preferences : [],
            completedAt: new Date()
        };

        await User.findByIdAndUpdate(
            req.user.id,
            { $set: { quizProfile } },
            { new: true }
        );

        res.json({ message: 'Quiz saved' });
    } catch (err) {
        next(err);
    }
});

router.get('/quiz/recommendations', authJWT, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const quiz = user.quizProfile;
        const concerns = (quiz && Array.isArray(quiz.concerns)) ? quiz.concerns : [];
        const preferences = (quiz && Array.isArray(quiz.preferences)) ? quiz.preferences : [];
        const skinType = quiz ? quiz.skinType : null;

        if (!quiz || !skinType || concerns.length === 0) {
            return res.status(400).json({ message: 'Quiz not completed' });
        }

        const match = {
            skinTypes: skinType,
            concerns: { $in: concerns }
        };

        const pipeline = [
            { $match: match },
            {
                $addFields: {
                    concernsScore: {
                        $size: { $setIntersection: ['$concerns', concerns] }
                    },
                    qualitiesScore: preferences.length > 0
                        ? { $size: { $setIntersection: ['$qualities', preferences] } }
                        : 0
                }
            },
            { $addFields: { score: { $add: ['$concernsScore', '$qualitiesScore'] } } },
            { $sort: { score: -1, soldCount: -1, createdAt: -1 } },
            { $limit: 12 },
            {
                $project: {
                    title: 1,
                    brand: 1,
                    category: 1,
                    price: 1,
                    stock: 1,
                    skinTypes: 1,
                    concerns: 1,
                    qualities: 1,
                    soldCount: 1,
                    score: 1
                }
            }
        ];

        const products = await Product.aggregate(pipeline);

        res.json(products);
    } catch (err) {
        next(err);
    }
});

module.exports = router;