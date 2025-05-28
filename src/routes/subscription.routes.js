import { Router } from 'express';
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription,
} from "../controllers/subscription.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

router.use(verifyJWT);

// POST → Toggle subscription to a channel
router.post("/c/:channelId/toggle", toggleSubscription);

// GET → Get all subscribers of a channel
router.get("/c/:channelId/subscribers", getUserChannelSubscribers);

// GET → Get all channels a subscriber follows
router.get("/u/:subscriberId/channels", getSubscribedChannels);

export default router