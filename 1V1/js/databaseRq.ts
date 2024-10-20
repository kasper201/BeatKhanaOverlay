router.get('/getUserByDiscord/:discordid', async(req, res) => {
    const discordID: string = req.params.discordid;

    if(!discordID){
        return res.status(400).json({ error: `Please specify a discord user id` })
    }

    const dbData: any = await sql`SELECT * FROM users WHERE discordid LIKE ${discordID}`;
    if(dbData.length == 0){
        return res.status(204).json({ error: `No user was found in the search, please provide a valid discord id.` });
    } else {
        return res.status(200).json(dbData);
    }
});

router.get('/getUserByScoresaber/:scoresaberid', async(req, res) => {
    const scoresaberID: string = req.params.scoresaberid;

    if(!scoresaberID){
        return res.status(400).json({ error: `Please specify a scoresaber user id` })
    }

    const dbData: any = await sql`SELECT * FROM users WHERE scoresaberid LIKE ${scoresaberID}`;
    if(dbData.length == 0){
        return res.status(204).json({ error: `No user was found in the search, please provide a valid scoresaber id.` });
    } else {
        return res.status(200).json(dbData);
    }
});