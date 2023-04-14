const express = require("express");
const router = express.Router();

const db = require("../db");

router.get("/context", async (req, res) => {
    const { id } = req.query;
    try {
        const currentRoomQuery = `
            SELECT rooms.name as current_room
            FROM current_room
            INNER JOIN rooms ON current_room.room_id = rooms.id
            WHERE current_room.user_id = $1
        `;
        const currentRoomResult = await db.query(currentRoomQuery, [id]);
        const currentRoom = currentRoomResult.rows[0]?.current_room || null;

        const leversCompletedQuery = `
            SELECT lever_id
            FROM levers_completed
            WHERE user_id = $1
        `;
        const leversCompletedResult = await db.query(leversCompletedQuery, [id]);
        const leversCompleted = leversCompletedResult.rows.map(row => row.lever_id);

        const roomsEnteredQuery = `
            SELECT room_id
            FROM rooms_entered
            WHERE user_id = $1
        `;
        
        const roomsEnteredResult = await db.query(roomsEnteredQuery, [id]);
        const roomsEntered = roomsEnteredResult.rows.map(row => row.room_id);

        const result = {
            current_room: currentRoom,
            levers_completed: leversCompleted,
            rooms_entered: roomsEntered
        };
        res.json(result);
    } catch (error) {
        console.error("ERROR: ", error);
        res.sendStatus(500);
    }
});

router.post("/current_room", async (req, res) => {
    const { id, room } = req.query;
    try {
        const query = {
            text: "UPDATE current_room SET room_id = (select id from rooms where name = $1) WHERE user_id = $2 RETURNING *",
            values: [room, id],
        };
        const response = await db.query(query);
        res.json(response.rows);
    } catch (error) {
        console.error("ERROR: ", error);
        res.sendStatus(500);
    }
});

router.post("/entered_room", async (req, res) => {
    const { id, room } = req.query;
    try {
        const query = {
            text: "INSERT INTO rooms_entered (room_id, user_id) VALUES ((select id from rooms where name = $1), $2) RETURNING *",
            values: [room, id],
        };
        const response = await db.query(query);
        res.json(response.rows);
    } catch (error) {
        console.error("ERROR: ", error);
        res.sendStatus(500);
    }
});

router.post("/lever_completed", async (req, res) => {
    const { id, lever_id } = req.query;
    try {
        const query = {
            text: "INSERT INTO levers_completed VALUES ($1, $2) RETURNING *",
            values: [lever_id, id],
        };
    } catch (error) {
        console.error("ERROR: ", error);
        res.sendStatus(500);
    }
});

module.exports = router;
