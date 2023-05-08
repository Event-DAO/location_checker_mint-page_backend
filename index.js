import express from "express";
import mysql from "mysql";
import cors from "cors";
// import rateLimit from 'express-rate-limit' // ip rate limit

const app = express();

// eski sorun
app.use(cors());
app.use(express.json());

// pool kullanmamızın sebei: PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR
const pool = mysql.createPool({
    host: process.env.MYSQL_HOST_IP,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    
  });

//   const mintListLimiter = rateLimit({
// 	windowMs: 10 * 60 * 1000, // 15 minutes
// 	max: 1, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
// 	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
// 	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
//     message: "Too many requests from this IP, please try again after 10 minutes"
// })

// app.use('/mintList', mintListLimiter)

app.get("/", (req, res) => {
    res.send("Hello this is the backend ! What are you looking for ?");
});



app.get("/locations/:id", (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM muze_locations WHERE id = ?";

    // console.log("id: " + id);

    pool.query(sql, id, (err, result) => {
        if (err) { 
            return res.send(err);
        } else {
            // console.log("test result"+result);
            return res.send(result);
            
        }
    });
});

app.get("/checkAccount/:account/:museum_id", (req, res) => {
    const account = req.params.account;
    const museum_id = req.params.museum_id;

    // console.log("account: " + account);
    // console.log("museum_id: " + museum_id);

    const sql = "SELECT * FROM Minted_Adresses WHERE Adresses LIKE '" + account + "' AND Muze LIKE '" + museum_id + "'";

    pool.query(sql, account, (err, result) => {
        if (err) { 
            return res.send(err);
        } else {
            var count = Object.keys(result).length;
            if (count > 0) {
                return res.send("true");
            } else {
                return res.send("false");
            }
        }
    });
});

app.post("/mintList", (req, res) => {

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress; // localde ::1 gözüküyor
    // console.log("ip: " + ip);

    const account = req.body.address;
    const museum_id = req.body.museum_id;

    const values = [
        req.body.museum_id,
        req.body.address,
        ip
    ];

    // console.log("account: " + account);
    // console.log("museum_id: " + museum_id);

    const sql_check = "SELECT * FROM Minted_Adresses WHERE Adresses LIKE '" + account + "' AND Muze LIKE '" + museum_id + "'";

    pool.query(sql_check, account, (err, result) => {
        if (err) { 
            return res.send(err);
        } else {
            var count = Object.keys(result).length;
            // console.log("count: " + count + "");
            if (count > 0) {
                return res.send("According to data records, this address has already been minted.");
            } else {
                const sql = "INSERT INTO Minted_Adresses (Timestamp, Muze, Adresses, IP) VALUES (CURRENT_TIMESTAMP, ?, ?, ?)";

                pool.query(sql, values, (err, result) => {
                    if (err) { 
                        return res.send(err);
                    } else {
                        if (result.affectedRows > 0) {
                            return res.send("success");
                        } else {
                            return res.send("error");
                        }
                        
                    }
                });
            }
        }
    });

    
    

});

app.listen(3300, () => {
    console.log("server is running on port 3300 !");
});