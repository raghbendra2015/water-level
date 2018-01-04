/**
 * V1/webservices/ReadingController
 *
 * @description :: Server-side logic for managing v1/webservices/readings
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var db = sails.config.globals.firebasedb();

module.exports = {

  /*
     * Name: tankReading
     * Created By: A-SIPL
     * Created Date: 8-dec-2017
     * Purpose: add new supplier
     * @param  req
     */
  tankReading: function (req, res) {
    var deviceId = req.param('deviceId');
    var timeFilter = req.param('timeFilter');
    var data = [];
    if('day'){
      data = [
        [{ "v": 49, "name": "1 PM" },
          { "v": 42, "name": "2 PM" },
          { "v": 29, "name": "3 PM" },
          { "v": 50, "name": "4 PM" },
          { "v": 60, "name": "5 PM" }
        ]
      ];
    }else if('week'){
      data = [
        [{ "v": 49, "name": "1 Week" },
          { "v": 42, "name": "2 Week" },
          { "v": 29, "name": "3 Week" },
          { "v": 50, "name": "4 Week" },
          { "v": 60, "name": "5 Week" }
        ]
      ];
    }else if('month'){
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
  },


  /*
     * Name: tankReading
     * Created By: A-SIPL
     * Created Date: 8-dec-2017
     * Purpose: add new supplier
     * @param  req
     */
  supplierListing: function (req, res) {
    console.log('red Data->',req);return true;
    var userId = req.param('userId');
    var latitude = req.param('latitude');
    var longitude = req.param('longitude');
    if(userId != '' && userId != undefined && latitude != '' && latitude != undefined && longitude != '' && longitude != undefined){
      var tankCapacity = (req.param('tankCapacity') && req.param('tankCapacity') != undefined) ? req.param('tankCapacity') : 0;
      var jsonData = [];
      var favouritesSuppliresId = [];
      var array = [];
      var favouritesSupplires ="";
      var reflikedSuppliers = db.ref("likes");
      reflikedSuppliers.orderByChild('user_id').equalTo(userId).once("value",
        function(snapshot) {
          favouritesSupplires = snapshot.val();
          for (key in favouritesSupplires) {
            if(favouritesSuppliresId.indexOf(favouritesSupplires[key].supplier_id) === -1){
              favouritesSuppliresId.push(favouritesSupplires[key].supplier_id);
            }
          }
        });
      var refSuppliers = db.ref("suppliers");
      refSuppliers.once("value", function (snapshot) {
        var suppliers = snapshot.val();
        for (key in suppliers) {
          if(suppliers[key].tank_capacity != undefined &&  suppliers[key].tank_capacity >= tankCapacity){
            var supplierWithDistance = {};
            distance =   ValidationService.getDistanceFromLatLonInKm(latitude,longitude,suppliers[key].latitude,suppliers[key].longitude);
            supplierWithDistance["supplier_id"] = key;
            supplierWithDistance["distance_in_km"] = distance;
            supplierWithDistance["account_number"] = suppliers[key].account_number;
            supplierWithDistance["area"] = suppliers[key].area;
            supplierWithDistance["city_id"] = suppliers[key].city_id;
            supplierWithDistance["city_name"] = suppliers[key].city_name;
            supplierWithDistance["company_name"] = suppliers[key].company_name;
            supplierWithDistance["country_id"] = suppliers[key].country_id;
            supplierWithDistance["country_name"] = suppliers[key].country_name;
            supplierWithDistance["created_date"] = suppliers[key].created_date;
            supplierWithDistance["email"] = suppliers[key].email;
            supplierWithDistance["latitude"] = suppliers[key].latitude;
            supplierWithDistance["longitude"] = suppliers[key].longitude;
            supplierWithDistance["mobile_number"] = suppliers[key].mobile_number;
            supplierWithDistance["name"] = suppliers[key].name;
            supplierWithDistance["tank_capacity"] = suppliers[key].tank_capacity;
            if(favouritesSuppliresId.indexOf(key)){
              supplierWithDistance["is_fav"] = 1;
            }else{
              supplierWithDistance["is_fav"] = 0;
            }
            if(distance &&  distance < sails.config.supplier_range ){
              jsonData.push(supplierWithDistance);
            }
          }
        }
        array.push(jsonData);
        array[0].sort(function (x, y) {
          var n = x.distance_in_km - y.distance_in_km;
          if (n != 0) {
            return n;
          }
          return x.is_fav - y.is_fav;
        });
        return res.json(array[0]);
      }, function (errorObject) {
        return res.serverError(errorObject.code);
      });
    }else{
      res.status(422);
      res.send(sails.config.flash.paramter_missing);
    }
  },

};

