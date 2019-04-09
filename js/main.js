/* Stylesheet by William D Gannon, 2019 */
/* For Lab2 Mapping in D3 */

(function () {
    //global variables
	var attrArray = ["Naloxone Administered in 2018", "Overdose Mortality in 2018",
				 "Naloxone Administered in 2017", "Overdose Mortality in 2017",
				 "Naloxone Administered in 2016", "Overdose Mortality in 2016",
				 "Naloxone Administered in 2015", "Overdose Mortality in 2015"
				];
	var expressed = attrArray[0];

	var chartWidth = window.innerWidth * 0.425,
		chartHeight = 460;
	//create a scale to size bars proportionally to frame
	var yScale = d3.scale.linear()
		.range([0, chartHeight])
		.domain([0, 600]);	
	
	window.onload = setMap(); //start script once HTML is loaded


	function setMap() { //set choropleth map parameters	
		//map frame dimensions
		var width = window.innerWidth * .5,
			height = 460;

		//create new svg container for the map
		var map = d3.select("body")
			.append("svg")
			.attr("class", "map")
			.attr("width", width)
			.attr("height", height);

		//create Albers equal area conic projection centered on New Jersey
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
			.defer(d3.json, "data/eastCoast.topojson") //load geometry from east coast states topojson
			.defer(d3.json, "data/Counties.topojson") //load geometry from NJ County topojson
			.await(callback);

		function callback(error, csvData, eCoast, NJCounties) {

			//place graticule on map
			setGraticule(map, path);

			//translate EastCoast TopoJSON
			var coastStates = topojson.feature(eCoast, eCoast.objects.eastCoast),
				counties = topojson.feature(NJCounties, NJCounties.objects.Counties).features;

			var eCoastStates2 = map.append("path") //create SVG path element
				.datum(topojson.feature(eCoast, eCoast.objects.eastCoast)) //bind States data to path element
				.attr("class", "eCoastStates2") //assign class for styling states
				.attr("d", path); //project data as geometry in svg

			//join csv data to GeoJson
			counties = joinData(counties, csvData);

			//create color scale
			var colorScale = makeColorScale(csvData);

			//add enumeration units to the map
			setEnumerationUnits(counties, map, path, colorScale);
			
			//add coordinated visualizations to map
			setChart(csvData, colorScale);

		}; //end of callback
		
	}; //end of setmap
		//function to create color scale generator
	function makeColorScale(data) {
		var colorClasses = [
        "#fef0d9",
        "#fdcc8a",
        "#fc8d59",
        "#e34a33",
        "#b30000"
    ];

		//create color scale generator
		var colorScale = d3.scale.threshold()
			.range(colorClasses);

		//build array of all values of the expressed attribute
		var domainArray = [];
		for (var i = 0; i < data.length; i++) {
			var val = parseFloat(data[i][expressed]);
			domainArray.push(val);
		};

		//cluster data using ckmeans clustering algorithm to create natural breaks
		var clusters = ss.ckmeans(domainArray, 5);
		//reset domain array to cluster minimums
		domainArray = clusters.map(function (d) {
			return d3.min(d);
		});
		//remove first value from domain array to create class breakpoints
		domainArray.shift();

		//assign array of last 4 cluster minimums as domain
		colorScale.domain(domainArray);
		return colorScale;
	};//End of make c
	function choropleth(props, colorScale) {
		//make sure attribute value is a number
		var val = parseFloat(props[expressed]);
		//if attribute value exists, assign a color; otherwise assign gray
		if (typeof val == 'number' && !isNaN(val)) {
			return colorScale(val);
		} else {
			return "#CCC";
		};
	};
	function setGraticule(map, path) {
		var graticule = d3.geo.graticule()
			.step([1.5, 1.5]); //place graticule lines every 10 degrees of longitude and latitude


		//create graticule lines	
		var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
			.data(graticule.lines) //bind graticule lines to each element to be created
			.enter() //create an element for each datum
			.append("path") //append each element to the svg as a path element
			.attr("class", "gratLines") //assign class for styling
			.attr("d", path); //project graticule lines	

	}; //end of setGraticule
	function joinData(counties, csvData) {
		for (var i = 0; i < csvData.length; i++) {
			var csvCounties = csvData[i];
			var csvKey = csvCounties.OBJECTID; //The CSV Pripary Key
			//Loop through geojson counties to find correct county
			for (var a = 0; a < counties.length; a++) {

				var geojsonProps = counties[a].properties; //the current county geojson properties
				var geojsonKey = geojsonProps.OBJECTID; //the geojson primary key

				//where primary keys match, transfer csv data to geojson properties object
				if (geojsonKey == csvKey) {

					//assign all attributes and values
					attrArray.forEach(function (attr) {
						var val = parseFloat(csvCounties[attr]); //get csv attribute value
						geojsonProps[attr] = val; //assign attribute and value to geojson properties
					});
				};
			};
		}; //end of for loop
		return counties;

	}; //end of join data
	function setEnumerationUnits(counties, map, path, colorScale) {
		//add NJ Counties to map
		var njcounties = map.selectAll(".njcounties")
			.data(counties)
			.enter()
			.append("path")
			.attr("class", function (d) {
				return "njcounties " + d.properties.OBJECTID;
			})
			.attr("d", path)
			.style("fill", function (d) {
				return choropleth(d.properties, colorScale);
			});
	}; //end of setEnumerationUnits
	
	function setChart(csvData, colorScale) {
		//chart frame dimensions

		//Example 2.1 line 17...create a second svg element to hold the bar chart
		var chart = d3.select("body")
			.append("svg")
            .attr("class", "chart")
			.attr("width", chartWidth)
			.attr("height", chartHeight);
        

		//set bars for each province
		var bars = chart.selectAll(".bars")
			.data(csvData)
			.enter()
			.append("rect")
			.sort(function (a, b) {
				return a[expressed] - b[expressed]
			})
			.attr("class", function (d) {
				return "bars " + d.OBJECTID;
			})
			.attr("width", chartWidth / csvData.length - 1)
			.attr("x", function (d, i) {
				return i * (chartWidth / csvData.length);
			})
			.attr("height", function (d) {
				return yScale(parseFloat(d[expressed]));
			})
			.attr("y", function (d) {
				return chartHeight - yScale(parseFloat(d[expressed]));
			})
			.style("fill", function (d) {
				return choropleth(d, colorScale);
			});
		//annotate bars with attribute value text
		var numbers = chart.selectAll(".numbers")
			.data(csvData)
			.enter()
			.append("text")
			.sort(function (a, b) {
				return a[expressed] - b[expressed]
			})
			.attr("class", function (d) {
				return "numbers " + d.OBJECTID;
			})
			.attr("text-anchor", "middle")
			.attr("x", function (d, i) {
				var fraction = chartWidth / csvData.length;
				return i * fraction + (fraction - 1) / 2;
			})
			.attr("y", function (d) {
				return chartHeight - yScale(parseFloat(d[expressed])) +17 ;
			})
			.text(function (d) {
				return d[expressed];
			});		
		//below Example 2.8...create a text element for the chart title
		var chartTitle = chart.append("text")
			.attr("x", 20)
			.attr("y", 40)
			.attr("class", "chartTitle")
			.text("Count of " + expressed+ "per 100k");
	}; //end of set chart
	



	

})();