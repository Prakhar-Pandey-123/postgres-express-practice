import express from "express"
import { Client } from "pg";

import dotenv from "dotenv"
dotenv.config();
const SQLClient=process.env.SQLClient;

const app=express();
const sqlClient=new Client(SQLClient)

async function connected(){
    try{
        await sqlClient.connect()
        console.log("db connected successfully")
    }
    catch(err){
        console.log(err);
    }
}
connected()

app.use(express.json());

app.post("/signup",async(req,res)=>{
    try{
         const username=req.body.username;
    const password=req.body.password;
    const gmail=req.body.gmail;
    const city=req.body.city;
    const country=req.body.country
    
    const userquery=`INSERT INTO users(username,password,gmail) VALUES($1, $2, $3) RETURNING id`
    // returning id will return the id 

    // now a transaction is like combining multiple queries together such that either all the queries work out successfully or neither of them will work

    await sqlClient.query("BEGIN");
    const userresponse=await sqlClient.query(userquery,[username,password,gmail]);

    const userid=userresponse.rows[0].id;

    console.log(userresponse.rows);
    const addressquery=`INSERT INTO addresses(city,country,user_id) VALUES($1,$2,$3)`

    const addressresponse=await sqlClient.query(addressquery,[city,country,userid]);

    await sqlClient.query("COMMIT")

    return res.json({
        success:true,
        addressres:addressresponse.rows,
        userres:userresponse.rows
    })
    }
   catch(err){
    return res.status(500).json({
        err:err,
        success:false
    })
   }
})


app.get("/see-joins",async(req,res)=>{
    const id=req.query.id;
    // method-1 

    const query1=`SELECT username,gmail,id FROM users WHERE id=$1`;
    const res1=await sqlClient.query(query1,[id]);

    const query2=`SELECT * FROM addresses WHERE user_id=$1`;
    const res2=await sqlClient.query(query2,[id]);

    // now we can here use join, to merge both the tables and do n*m , on the basis of a common field, which is present in both the tables.like here its user_id 

    //method-2,, ====================inner join=============

    const query3=`SELECT users.id,users.username,users.gmail,addresses.city,addresses.country 
        FROM users JOIN addresses
        ON users.id=addresses.user_id
        WHERE users.id=$1`
        // fjo=farji ho, now this will show combined result of prev u queries
    

    const res3=await sqlClient.query(query3,[id]);

    // now what if the data for the query exists in table 1 but not in table 2 , so with inner join no data will be shown as there will be no common ground for second table to get merged, hence we can use left join, in this all the entries of left side 

    const query4=`SELECT users.id,users.username,users.gmail,addresses.city,addresses.country 
        FROM users LEFT JOIN addresses 
        ON users.id=addresses.user_id
        WHERE users.id=$1`
    const res4=await sqlClient.query(query4,[id]);

    // now what if the data exists only on right table not on left table , then we want that right tables data, with inner join we will see nothing, use right join 
    const query5=`SELECT users.id,users.username,users.gmail,addresses.city,addresses.country 
        FROM users RIGHT JOIN addresses 
        ON users.id=addresses.user_id
        WHERE users.id=$1`
    const res5=await sqlClient.query(query5,[id]);

    // now comes the full join , which is basically combination of the left and right join, means it will show all overlapping data as well unique data of the left and right table

    const query6=`SELECT users.id,users.username,users.gmail,addresses.city,addresses.country 
        FROM users FULL JOIN addresses 
        ON users.id=addresses.user_id
        WHERE users.id=$1`

    const res6=await sqlClient.query(query6,[id]);



    res.json({
        user1:res1?.rows[0],
        address1:res2?.rows,
        res3:res3?.rows,
        res4:res4?.rows,
        res5:res5?.rows,
        res6:res6?.rows
    })

})

app.listen(4000,()=>{
    console.log("app is listening at port 4000");
})



//============ code of class 1 ============================

// import express  from "express";

// import { Client } from "pg";

// const pgClient=new Client("xxxxxx")

// const app=express()
// app.use(express.json());

// // connecting the database
// async function connected(){
//     try{
//         await pgClient.connect();
//         console.log("db connected ")
//     }
//     catch(err){
//         console.log(err);
//     }
// }
// connected()

// app.post("/signup",async(req,res)=>{
//     try{
//         const username=req.body.username;
//     const password=req.body.password;
//     const gmail=req.body.email;

//     // const response=await pgClient.query(`INSERT INTO users(username,password,gmail) 
//     //     VALUES('${username}','${password}','${gmail}' )`);

// const insertQuery=`INSERT INTO users(username,password,gmail) VALUES($1, $2 ,$3)`
// // this is done to prevent sql injections
//         const response=await pgClient.query(insertQuery,[username,password,gmail]);

//     console.log(response);
//     return res.json({
//         success:true,
//         message:"you have signed up",
//     })

//     }
//     catch(err){
//         return res.json({
//             success:false,
//             err:err
//         })
//     }
// })
// app.listen(3000)






// this is the output of see-joins where the id exits in left table and not right table
// ====================================
// "user1": {
//     "username": "prakhar-4",
//     "gmail": "prakhar-4@gmail.com",
//     "id": 6
//   },
//   "address1": [],
//   "res3": [],
//   "res4": [
//     {
//       "id": 6,
//       "username": "prakhar-4",
//       "gmail": "prakhar-4@gmail.com",
//       "city": null,
//       "country": null
//     }
//   ],
//   "res5": [],
//   "res6": [
//     {
//       "id": 6,
//       "username": "prakhar-4",
//       "gmail": "prakhar-4@gmail.com",
//       "city": null,
//       "country": null
//     }
//   ]