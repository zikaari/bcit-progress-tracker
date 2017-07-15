import { Scrapper } from './Scrapper'
import { Renderer } from './Renderer'
import { Server } from './Server'
import Chrome from './Chrome'

(function Main() {
    Scrapper.init()
    Server.init()
    Chrome.init()
})()