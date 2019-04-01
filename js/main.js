/* Stylesheet by William D Gannon, 2019 */
/* For Lab2 Mapping in D3 */

//global variables
/*var keyArray =[
	"Admin_Per100k_2018","Mortality_Per100k_2018",
	"Admin_Per100k_2017", "Mortality_Per100k_2017",
	"Admin_Per100k_2016", "Mortality_Per100k_2016",
	"Admin_Per100k_2015", "Mortality_Per100k_2015"
	];*/
//var expressed = keyArray[0];	

window.onload = setMap(); //start script once HTML is loaded


function setMap() { //set choropleth map parameters	
	//map frame dimensions
	var width = 960,
		height = 560;
	
	//create new svg container for the map
	var map = d3.select("body")
		.append("svg")
		.attr("class", "map")
		.attr("width", width)
		.attr("height", height);
	
	//create Albers equal area conic projection centered on France
    var projection = d3.geo.albers()
        .center([4, .2])
        .rotate([80, -40])
        .parallels([49, 62])
        .scale(12000)
        .translate([width / 2, height / 2]);

    var path = d3.geo.path()
        .projection(projection);
	
	//map frame dimensions
	d3.queue() //use queue.js to parallelize asynchronous data loading for cpu efficiency
		.defer(d3.csv, "data/New_Jersey_Counties_ODData.csv") //load attributes data from csv
		.defer(d3.json, "data/eastCoast_project.topojson") //load geometry from east coast states topojson
		.defer(d3.json, "data/NJCountyODData_Project.topojson") //load geometry from NJ County topojson
		.await(callback);

	function callback(error, csvData, eCoast, NJCounties) {
		var graticule = d3.geo.graticule()
			.step([1.5, 1.5]); //place graticule lines every 5 degrees of longitude and latitude

		var gratBackground = map.append("path")
			.datum(graticule.outline) //bind graticule background
			.attr("class", "gratBackground") //assign class for styling
			.attr("d", path); //project graticule

		//create graticule lines
		var gratBackground = map.append("path")
			.datum(graticule.outline) //bind graticule background
			.attr("class", "gratBackground") //assign class for styling
			.attr("d", path); //project graticule
	
		//translate EastCoast TopoJSON
		var coastStates = topojson.feature(eCoast, eCoast.objects.eastCoast_project),
			counties = topojson.feature(NJCounties, NJCounties.objects.NJCountyODData_Project).features;

		//add States boundaries to map
		/*var eCoastStates = map.append("path")
            .datum(counties)
            .attr("class", "eCoastStates")
            .attr("d", path);
		*/

		var eCoastStates2 = map.append("path") //create SVG path element
			.datum(topojson.feature(eCoast, eCoast.objects.eastCoast_project)) //bind countries data to path element
			.attr("class", "eCoastStates2") //assign class for styling countries
			.attr("d", path); //project data as geometry in svg


		//add NJ Counties regions to map
		var njcounties = map.selectAll(".njcounties")
			.data(counties)
			.enter()
			.append("path")
			.attr("class", function (d) {
				return "njcounties " + d.properties.adm1_code;
			})
			.attr("d", path);

// LEFT OFF TRYING TO GET A BACKGROUND TO THIS DAMN GRATICULE
		//examine the results
		//console.log(graticule)
		//console.log(njcounties)
		//console.log(eCoast);
		//console.log(NJCounties);
	};
	};