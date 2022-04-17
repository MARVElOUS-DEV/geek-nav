const request = require('request');
const cheerio = require('cheerio');
const mongoose = require("mongoose");
const  mongoCfg =require('./config/mongodb.ts').default;
var db = mongoose.connect(mongoCfg.mongoUrl, { useNewUrlParser: true,useUnifiedTopology: true });
db.mongoose=mongoose
//引入数据模型模块
const navData = require("./app/model/nav")(db);
const categorySchema = require("./app/model/category")(db);
const userSchema = require("./app/model/user")(db);
class Reptile {
  constructor(url, type) {
    this.rootUrl = 'http://chuangzaoshi.com/'
    this.url = this.rootUrl + url
    this.type = type
    this.init()
  }

  async init() {
    let categoryData = {
      name: this.type,
      categoryId: '',
    }
    const categoryDataRes = await categorySchema.create(categoryData)
    this.categoryId = categoryDataRes._id
    this.start()
  }

  async start() {
    request(this.url, async (error, res, body) => {
      if (!error && res.statusCode == 200) {
        const $ = cheerio.load(body)
        const $cardBlock = $('.panel')

        for (let i = 0; i < $cardBlock.length; i++) {
          const secondCategoryName = $('.panel-title.card').eq(i).text().trim()
          const {_id: secondCategoryId } = await categorySchema.create({
            categoryId: this.categoryId,
            name: secondCategoryName
          })

          const websites = []
          const length = $('.panel').eq(i).find('.card-title').length
          for (let j = 0; j < length; j++) {
            const name = $('.panel').eq(i).find('.card-title').eq(j).text().trim()
            const href = $('.panel').eq(i).find('.card .card-heading').eq(j).attr('title')
            const desc = $('.panel').eq(i).find('.card .card-body').eq(j).text().trim()
            const logo = this.rootUrl + $('.panel').eq(i).find('.card-icon img').eq(j).attr('src')
            websites.push(navData.create({
              categoryId: secondCategoryId,
              name,
              href,
              desc,
              logo,
            }))
          }
          await Promise.all(websites)
        }
      }

      console.log(`${this.url}请求完成`)
    });
  }
}





async function main() {
  await Promise.all([
    new Reptile('index', '设计'),
    new Reptile('code', '前端'),
    new Reptile('operate', '运营'),
    new Reptile('product', '产品')
  ])
  let admin = {
    username: process.env.USERNAME,
    password: process.env.PASSWORD,
    isAdmin:true
  }
  const userDataRes = await userSchema.create(admin)
  console.log("db init done✅✅✅✅");
}

main()
