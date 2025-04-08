import '../config.js'
import connectDB from "./db/indexdb.js";
import {app} from './app.js'

const port = process.env.PORT | 8000

connectDB()
.then(() => {
    app.on("error",(error)=>{
      console.log("Error: ",error);
      throw error;
    })
    app.lisen(port, () => {
        console.log(`Server is running at port : ${porrt}`);
    })
})
.catch((error) => {
    console.log("MONGO Connection Failed !!! ", error);
})