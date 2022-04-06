import express from "express"
import cluster from "cluster"
import core from "os"
import log4js from "log4js"
import minimist from "minimist"
import APIControl from "./routes.js"

const app = express();

app.use(express.json())
app.use('/',APIControl)

let minimizedArgs= minimist(process.argv) 
export let port = minimizedArgs.port || 8080
if (!minimizedArgs.mode) minimizedArgs.mode= "FORK"

let server
if (minimizedArgs.mode === "CLUSTER") {  
    if (cluster.isPrimary) {
        console.log(`proceso primario - pid: ${process.pid}`)
        for (let i=0; i<core.cpus().length; i++) {
            cluster.fork()
        }
        cluster.on("exit",(worker,code,signal)=> {
            console.log(`worker ${worker.process.pid} caído`)
            cluster.fork()
            console.log(`worker restaurado`)
        })
    } else {
        server = app.listen(port, ()=>{
            console.log(`Servidor worker pid: ${process.pid} escuchando en ${port} `)
        })
    }
} else if (minimizedArgs.mode === "FORK") {
    server = app.listen(port, ()=> {
        console.log(`listening in ${port}`)
    })
}

log4js.configure({
    appenders: {
        //que tipo de transport vamos a utilizar                    
        console:{type:"console"},
        warningsFile: {type:"file", filename:"./warn.log"},
        errorsFile:{type:"file", filename:"./errors.log"},
        warningLevelFilter:{
            type: "logLevelFilter",
            level: "warn",
            maxLevel: "warn",
            appender: "warningsFile"
        },
        errorLevelFilter:{      
            type:"logLevelFilter",
            level: "error",
            maxLevel: "error",
            appender: "errorsFile"
        } 
    },
    categories:{
        default: {
            appenders:["console"], level:"all"
        },
        dev: {
            appenders:["warningLevelFilter","errorLevelFilter","console"], level:"all" 
        },
        prod: {
            appenders:["errorLevelFilter","console"], level: "all"
        }
    }
})

//El NODE_ENV está configurado en Run>Add Conf>NodeJS>launch.json