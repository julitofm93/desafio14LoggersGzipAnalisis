import { Router } from 'express';
import compression from "compression"
import log4js from "log4js"
import minimist from "minimist"
import cluster from "cluster"
import core from "os"



let minimizedArgs= minimist(process.argv)
const logger = log4js.getLogger(process.env.NODE_ENV);

const APIControl = Router();
let sentence = "Hola mundo"

APIControl.get('/',(req,res)=>{
    let response = ""
    for(let i=0;i<1000;i++){
        response+=sentence;
    }
    res.send({message:response});
})

APIControl.get('/saludogzip',(req,res)=>{
    let response = ""
    for(let i=0;i<1000;i++){
        response+=sentence;
    }
    res.send({message:response});
})

APIControl.get('/error', (req,res)=>{
    logger.error("Tronó algo")
    res.send("Tronó algo")
})

APIControl.get("*", (req, res, next) => {
    logger.warn(`ruta inexistente! Método: ${req.method} Ruta: ${req.url}`)
    res.send("Warning, ruta inexistente")
    next()
})
 
APIControl.get("/info", compression(), (req,res)=> {
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

export default APIControl;