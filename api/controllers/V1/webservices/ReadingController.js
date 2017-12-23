/**
 * V1/webservices/ReadingController
 *
 * @description :: Server-side logic for managing v1/webservices/readings
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var db = sails.config.globals.firebasedb();

module.exports = {

  /*
     * Name: addSupplier
     * Created By: A-SIPL
     * Created Date: 8-dec-2017
     * Purpose: add new supplier
     * @param  req
     */
  tankReading: function (req, res) {
    var deviceId = req.param('deviceId');
    var timeFilter = req.param('timeFilter');
    if(timeFilter =='day'){
      data = [
        [{ "v": 49, "name": "1 PM" },
          { "v": 42, "name": "2 PM" },
          { "v": 29, "name": "3 PM" },
          { "v": 50, "name": "4 PM" },
          { "v": 60, "name": "5 PM" }
        ]
      ];
    }else if(timeFilter == 'week'){
      data = [
        [{ "v": 49, "name": "1 Week" },
          { "v": 42, "name": "2 Week" },
          { "v": 29, "name": "3 Week" },
          { "v": 50, "name": "4 Week" },
          { "v": 60, "name": "5 Week" }
        ]
      ];
    }else if(timeFilter =='month'){
      data = [
        [{ "v": 49, "name": "Aug" },
          { "v": 42, "name": "Sep" },
          { "v": 29, "name": "Oct" },
          { "v": 50, "name": "Nov" },
          { "v": 60, "name": "Dec" }
        ]
      ];
    }else{
      data = [
        [{ "v": 49, "name": "Aug" },
          { "v": 42, "name": "Sep" },
          { "v": 29, "name": "Oct" },
          { "v": 50, "name": "Nov" },
          { "v": 60, "name": "Dec" }
        ]
      ];
    }
    return res.json(data);
  }

};

