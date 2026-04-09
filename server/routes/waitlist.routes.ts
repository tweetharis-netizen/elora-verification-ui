import { Router, Request, Response } from 'express';
import { db } from '../database.js';
import { sendEmail } from '../utils/mailer.js';

const router = Router();

// POST /api/waitlist
router.post('/', async (req: Request, res: Response) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        // 1. Save to database
        try {
            db.run(`INSERT INTO waitlist (email) VALUES (?)`, email);
        } catch (dbErr: any) {
            // Ignore unique constraint errors (already in waitlist)
            if (!dbErr.message.includes('UNIQUE')) {
                throw dbErr;
            }
        }

        // 2. Send email notification to the founder
        await sendEmail({
            to: 'tweetharis@gmail.com',
            subject: 'New Pilot Program Interest!',
            text: `New user interested in the pilot program: ${email}`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #FBBF24;">New Pilot Interest!</h2>
                    <p>A new user has requested to join the Elora pilot program.</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <hr />
                    <p style="font-size: 12px; color: #666;">This is an automated notification from the Elora platform.</p>
                </div>
            `
        });

        res.status(200).json({ message: 'Success' });
    } catch (err: any) {
        console.error('Waitlist error:', err);
        res.status(500).json({ error: 'Failed to process waitlist request' });
    }
});

export default router;
