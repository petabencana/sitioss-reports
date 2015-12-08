Database reconnection
---------------------

To test database error reconnection:
- Start reports app with Gnip data source
- Wait until data source is running
- Tail application log
- Stop database
- Watch log for database error notification and reconnection message
- Generate a tweet matching the data source criteria
- Watch log for message that tweet cached for later processing
- Start database
- Wait for reports app to reconnect
- Watch log and ensure reconnection happens and cached tweet is processed
