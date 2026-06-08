import config from './config/index.js'
import app from './app.js'
import initDb from './db/index.js'


const main=async()=>{
    initDb()
    app.listen(config.port, () => {
  console.log(`Example app listening on port ${config.port}`)
})
}
main()
