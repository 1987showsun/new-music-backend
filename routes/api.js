var express       = require('express');
var jwt           = require('jsonwebtoken');
var MongoClient   = require('mongodb').MongoClient;
var ObjectId      = require('mongodb').ObjectID;
var url           = 'mongodb://127.0.0.1:27017';
var router        = express.Router();
var dbName        = 'new_music';
var db;

MongoClient.connect(url, function(err, client) {
  db = client.db(dbName);
});

router.post('/login', function(req, res, next) {
  var body           = req.body || {};
  var msg            = "";
  var code           = -1;
  var Authorization  = "";

  if( body.hasOwnProperty("username") && body.hasOwnProperty("password") ){
    db.collection('staffMember').find(body).toArray(function(err,data) {
      if( data.length>1 || data.length==0 ){
        code = -1;
        msg  = "登入失敗";
      }else{
        code  = 0;
        msg   = "登入成功";
        Authorization = "Basic "+jwt.sign({data},"1231231231") ; 
      }

      returnJson(code,msg,Authorization);
    });
  }else{
    code = -1;
    msg  = "登入失敗";
    returnJson(code,msg,Authorization);
  }

  function returnJson(code,msg,Authorization){
    res.json({
      code  : code,
      msg   : msg,
      Authorization : Authorization
    })
  }
});

router.get('/list/:type', function(req, res, next) {

  var dbCollectionsName   = req.params.type;
  var initCurrentPage     = 1;
  var maxLimit            = 10;
  var currentPage         = Number(req.query['currentPage']) || initCurrentPage;
  var limit               = Number(req.query['limit'])       || maxLimit;

  db.collection(dbCollectionsName).find().toArray(function(err,data) {
    var total           = data.length;
    var currentPageDAta = data.filter((item,i)=>{
      return i>=((currentPage*limit)-limit) && i<(currentPage*limit);
    })

    res.json({
      code : 0,
      msg  : "成功取得",
      data : {
        currentPage : currentPage,
        limit       : limit,
        total       : total,
        list        : currentPageDAta
      }
    })
  });
})

router.get('/info/:type', function(req, res, next) {

  var dbCollectionsName   = req.params.type;
  var id                  = req.query['id'] || "";

  db.collection(dbCollectionsName).find({ "_id": ObjectId(id) }).toArray(function(err,data) {

    switch (dbCollectionsName) {
      case "incs":
        db.collection("teams").find({ "inc_id": ObjectId(id) }).toArray(function(err,singerData) {
          db.collection("albums").find({ "inc_id": ObjectId(id) }).toArray(function(err,albumData) {
            res.json({
              code : 0,
              msg  : "成功取得",
              data : {
                "info"   : data,
                "singer" : singerData,
                "album"  : albumData
              }
            })
          });
        });
        break;
    
      default:
        db.collection("albums").find({ "teams_id": ObjectId(id) }).toArray(function(err,albumData) {
          res.json({
            code : 0,
            msg  : "成功取得",
            data : {
              info  : data,
              album : albumData
            }
          })
        });
        break;
    }
  });
})

router.get('/user', function(req, res, next) {
  let find = Object.assign({},req.query);
  delete find['limit'];
  delete find['page'];
  delete find['password'];

  db.collection('user').find(find).toArray(function(err,data) {

    var limit      = Number(req.query.limit) || 10;
    var page       = Number(req.query.page)  || 1;
    var min        = 0+(limit*(page-1));
    var max        = limit+((limit*(page-1))-1);
    var filterData = data.filter(function(el,i){
      if( i>=min && i<=max ){
        return delete el['password'];
      }
    });

    res.json({
      code       : 0,
      msg        : "成功",
      total      : data.length,
      limit      : limit,
      nowPage    : page,
      list       : filterData
    });
  });
});

router.get('/album', function(req, res, next) {
  let find = Object.assign({},req.query);
  delete find['limit'];
  delete find['page'];

  db.collection('album').find(find).toArray(function(err,data) {
    var limit      = Number(req.query.limit) || 10;
    var page       = Number(req.query.page)  || 1;
    var min        = 0+(limit*(page-1));
    var max        = limit+((limit*(page-1))-1);

    var filterData = data.filter(function(el,i){
      if( i>=min && i<=max ){
        return el;
      }
    });

    res.json({
      code       : 0,
      msg        : "成功",
      total      : data.length,
      limit      : limit,
      nowPage    : page,
      list       : filterData
    })
  });
})

module.exports = router;
