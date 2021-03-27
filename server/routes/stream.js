const express = require('express');
const router = express.Router();
const {SSE_RESPONSE_HEADER} = require('../contants')

class StreamRoutes {
    init = () => {
        router.get('/:id', function(req, res, next) {
            const {id} = req.params;
            global.users[id] = res;
        
            res.writeHead(200, SSE_RESPONSE_HEADER);
            res.write(`data: [${id}] Connection successfully \n\n`);
        });
        
        router.get('/send/:id', async function(req, res, next) {
            const {id} = req.params;
            const {message} = req.query;
            
            global.users[id].write("data: " + message + "\n\n");
        
            
            res.send("message send");
        })
        return router;
    }
}


module.exports = StreamRoutes;