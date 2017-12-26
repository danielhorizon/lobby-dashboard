function fnResinName(d) {
  switch(d.resin){
    case 'PR 25 Gray':
      var resin = 'PR 25'; 
      break; 
    case 'v1.10 PR 25 Gray':
      var resin = 'PR 25'; 
      break; 
    case 'v1.10 PR 25 CMYKW':
      var resin = 'PR 25'; 
      break; 
    case 'UMA 90 CMYKWG':
      var resin = 'UMA 90'; 
      break; 
    default: 
      var resin = d.resin;
    }
  return resin; 
}

function fnRating(d){return d.feedback; }
function fnDate(d){return d.day;}
function fnPeople(d){return d.printed_by;}
function fnTime(d){return d.print_time;}

function init(data){
  // set crossfilter 
  var ndx = crossfilter(data);
  var n = ndx.groupAll().reduceCount().value(); 
  console.log("There are " + n + " items in the array");

  var resVol = ndx.groupAll().reduceSum(function(d){return d.volume_ml;}).value()

  console.log("Total resin usage " + resVol);

  var n = ndx.groupAll().reduceCount().value();
  console.log("There are " + n + " types of resin");

  // resins 
  var resins = ndx.dimension(fnResinName); 
  var ratings = ndx.dimension(fnRating); 
  var dates = ndx.dimension(fnDate); 
  var names = ndx.dimension(fnPeople); 
  var time = ndx.dimension(fnTime);

  var resinVolSum = resins.group().reduceSum(function(d){return d.resin_vol;});
  var ratingCount = ratings.group().reduceCount(function(d){return d.feedback;});
  var printCount = dates.group().reduceCount(function(d){return d.day;});
  var printTime = dates.group().reduceSum(function(d){return d.print_time;});
  var nameCount = names.group().reduceCount(function(d){return d.printed_by;});

  var countName = ndx.dimension(function(d){ return d.printed_by;});
  var printsByPrinter = ndx.dimension(function(d){ return d.printer;});
  var minMax = d3.extent(data, fnDate);

  dc.barChart('#print-time-chart')
    .width(600)
    .height(250)
    .margins({top: 10, right: 10, bottom: 40, left: 50})
    .dimension(dates)
    .x(d3.time.scale().domain(minMax))
    .round(d3.time.day.round)
    .xUnits(d3.time.days)
    .xAxisLabel("Date")
    .yAxisLabel("Time (m)")
    .group(printTime)

  var printerSelection = dc.selectMenu('#printer-select')
    .multiple(true)
    .numberVisible(15)
    .dimension(printsByPrinter)
    .group(printsByPrinter.group().reduceCount())

  var userSelection = dc.selectMenu('#user-select')
    .multiple(true)
    .numberVisible(15)
    .dimension(countName)
    .group(countName.group().reduceCount())

  //var color = d3.scale.ordinal(d3.scale.category20()); 
  dc.barChart('#resin-chart')
    .width(600)
    .height(250)
    .margins({top: 10, right: 10, bottom: 40, left: 50})
    .dimension(resins)
    .group(resinVolSum)
    .x(d3.scale.ordinal(fnResinName))
    .xUnits(dc.units.ordinal)
    .ordinalColors(['#6000ff', '#c3e0fb', '#8bd5e3', '#15c39a', '#f23452', '#fff68f', '#ffa500', '#8db6cd', 
       '#3366ff', '#66ff33'])
    .colorAccessor(function(d, i){return i;})
    .xAxisLabel("Resin Type")
    .yAxisLabel("Vol (mL)")
    .elasticY(true)
  

  var printerSelection = dc.selectMenu('#printer-select')
    .multiple(true)
    .numberVisible(15)
    .dimension(printsByPrinter)
    .group(printsByPrinter.group().reduceCount())

  dc.pieChart('#rating-pie-chart')
    .width(600)
    .height(250)
    .dimension(ratings)
    .group(ratingCount)  
    .innerRadius(20); 

  var printChart = dc.barChart('#print-count-chart')
    .width(600)
    .height(250)
    .margins({top: 10, right: 10, bottom: 40, left: 30})
    .dimension(dates)
    .x(d3.time.scale().domain(minMax))
    .round(d3.time.day.round)
    .xUnits(d3.time.days)
    .xAxisLabel("Date")
    .yAxisLabel("Print Count")
    .group(printCount)

  dc.renderAll();
}

console.time('loading prints');
var filenameMatch = /file=(.*)/.exec(window.location.search);  
var filename = filenameMatch ? filenameMatch[1] : "tth.json"
d3.json(filename, function(error, data) {
  prints = data.prints.filter(function(r){
    return r.print.finished_at; 
  }).map(function (r) {
    var print = r.print;
    var printer = r.printer.name;
    var print_length = (Date.parse(r.print.finished_at) - Date.parse(r.print.started_at))/60000; 
    var rating = r.print.print_data.feedback_rating;
    return {
      day: d3.time.day(new Date(Date.parse(r.print.started_at))),
      print_time: print_length,
      finished: r.finished_at || 0, 
      id: r.print.id,
      feedback:  rating ? '' + rating : "unrated", 
      printer: printer,
      resin: r.print.resin.name,
      resin_vol: r.print.volume_ml, 
      printed_by: r.print.printed_by.name, 
      filename: r.print.print_data.name, 
      partcount: r.print.print_data.data.part.length,
    };
  });
  init(prints);
});

