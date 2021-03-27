// response header for sever-sent events
const SSE_RESPONSE_HEADER = {
  'Content-Type': 'text/event-stream',
  'Connection': 'keep-alive',
  'Cache-Control': 'no-cache',
  'X-Accel-Buffering': 'no',
  "Access-Control-Allow-Origin": "*"
  };

module.exports = {SSE_RESPONSE_HEADER};