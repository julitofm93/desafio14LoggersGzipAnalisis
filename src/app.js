import express from "express"
import cluster from "cluster"
import core from "os"
import compression from "compression"
import log4js from "log4js"
import minimist from "minimist"

const app = express();

app.use(compression())

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
const logger = log4js.getLogger(process.env.NODE_ENV);


let sentence = "Hola mundo"

app.get('/',(req,res)=>{
    let response = ""
    for(let i=0;i<1000;i++){
        response+=sentence;
    }
    res.send({message:response});
})

app.get('/saludogzip',(req,res)=>{
    let response = ""
    for(let i=0;i<1000;i++){
        response+=sentence;
    }
    res.send({message:response});
})

app.get('/error',(req,res)=>{
    logger.error("Tronó algo")
    res.send("Tronó algo")
})

app.get("*", (req, res, next) => {
    logger.warn(`ruta inexistente! Método: ${req.method} Ruta: ${req.url}`)
    res.send("Warning, ruta inexistente")
    next()
})

app.get("/info", compression(), (req,res)=> {
    logger.info(`Método: ${req.method} Ruta: ${req.url}`)
    const info= {
        entry_arg: minimizedArgs._.slice(2),
        platform: process.platform,
        node_version: process.version,
        reserved_memory: process.memoryUsage(),
        execution_path: process.execPath,
        process_id: process.pid,
        proyect_folder: process.cwd(),
        cpus: cluster.isPrimary? 1: core.cpus().length
    }
    res.send(info)
    console.log(info)
})