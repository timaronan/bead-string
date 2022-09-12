import {select, selectAll, pointer} from 'd3-selection';
import transition from 'd3-transition';

export default function() {
  var margin = {top: 30, right: 80, bottom: 70, left: 100};
	var height = 500;
	var width = 2200;
	var innerWidth = width - margin.left - margin.right;
	var innerHeight = height - margin.top - margin.bottom;
			
	var highlightKey = "";
	var duration = 1000;

	var updateLayout = null;
	var updateAllStrings = null;
	var addBeadStringToSVG = null;

	var data = [];
	var xKey = "";
	var xLabelFormat = function(d){
		return d;
	};

	var bead_count = 0;
	var hide_class = "hidden-element";
	var colours_per = 0;
	var max_beads_colour = 10;
	var max_beads = 100;
	var bead_strings = [];
	var history = [];
	var future = [];
	var activeRadius = {};
	var stickDefault = {x: 20, y: 132};
	var historyIterate = 0;
	var drawingPath, extentCircle, startCircle, grabChart, grabString, grabEnd, startDrag, stickyMove, movingSticky, currentBeadString;
	var rectOffset = 2;
	var moveAction = false;
	var markerRadius = 3;
	var viewBoxHeight = 675;
	var viewBoxWidth = 1200;
	var drawingSpace = viewBoxHeight * 0.125;
	var startPoint = false;
	var endPoint = false;
	var historyDebounce = 1000;
	var chartPadding = 0.03;
	var oldX = 0;
	var min_bead_count_size = 20;
	var draggingBead = false;
	var axisSpace = 10;
	var axis_offset = viewBoxWidth * chartPadding;
	var axis_width = viewBoxWidth - (axis_offset * 2);
	var viewBoxEquator = viewBoxHeight * 0.5;
	var viewBoxDimensions = `0 0 ${viewBoxWidth} ${viewBoxHeight}`;
	var touchEvents = ['touchstart', 'touchmove', 'touchend'];
	var fontSizes = 4;
	var collisionDetectionSpace = 0.02;
	var textBackgroundRadius = 20;
	var clickInterval = 750;
	var lastClick = 0;
	var operators = {
			'>=': function(a, b) { return a >= b },
			'<=': function(a, b) { return a <= b },
	};
	var currentIndex = 0;
	var bead_string_items = 0;

	function beadString(selection){
		console.log("beadString", selection)
		selection.each(function () {
			var container = select(this);
			
			addBeadStringToSVG = function(bead_count,colours_per,show_numbers){
				console.log("addBeadStringToSVG",bead_count,colours_per,show_numbers)
					var name = `beadString-${currentIndex}`;
					var beads = [];
					var radius = calculateRadius(axis_width,parseInt(bead_count),axisSpace);
					var beadRadius = radius;
					// var beadRadius = radius < activeRadius.minimum ? radius : activeRadius.minimum;
					var movingSpace = axisSpace * beadRadius;
					activeRadius.minimum = calculateRadius(axis_width,min_bead_count_size,axisSpace);
					activeRadius[name] = radius;

					for (let index = 0; index < bead_count; index++) {
							var bead = {};
							bead.padding = 0;
							bead.index = index;
							bead.colour = Math.ceil((index + 1) / colours_per) % 2 === 0 ? 'white' : 'red';
							bead.radius = beadRadius;
							bead.center = axis_offset + movingSpace + ((index + 0.5) * (beadRadius * 2));
							bead.start = bead.center - bead.radius;
							bead.end = bead.center + bead.radius;
							bead.class = `bead ${bead.colour}`;
							beads.push(bead);
					}

					bead_strings.push({
							'index': currentIndex,
							'name': name,
							'beads': beads,
							'strings': [],
							'numbers': show_numbers
					});
					currentIndex++;
					executeHistoryUpdate(JSON.parse(JSON.stringify(bead_strings)));
					initChart();
			}
			console.log(addBeadStringToSVG)
			
			function undoAction(){
					future.push(history[0]);
					history = history.length > 1 ? [...history.slice(1)] : history;
					bead_strings = JSON.parse(JSON.stringify(history[0]))
					initChart();
			}
			function redoAction(){
					executeHistoryUpdate(future[0], false);
					future = future.length > 0 ? [...future.slice(1)] : [];
					bead_strings = JSON.parse(JSON.stringify(history[0]))
					initChart();
			}
			function stringAction(){
					toggleHide(modal_container);
			}
			function createAction(){
					var bead_count = beads_input.property("value");
					var colours_per = beads_colour_input.property("value");
					addBeadStringToSVG(bead_count,colours_per,true);
			}
			function rotateFont(val, that){
					var parent = select(that.parentNode.parentNode);
					var font = parent.data()[0].font;
					var newFont = font+val;
					var currentClass = `font-size-${font%fontSizes}`;
					var updatedClass = `font-size-${newFont%fontSizes}`;
					parent.data([{"font":newFont}])
							.classed(currentClass, false)
							.classed(updatedClass, true);
			}
			function toggleHide(el){
					el.classed(hide_class, !el.classed(hide_class))
			}
			function buildAxis(axis){
					axis.append("line")
							.attr("class", "beadString-axis")
							.attr("x1", axis_offset)
							.attr("x2", viewBoxWidth - axis_offset)
							.attr("y1", viewBoxEquator)
							.attr("y2", viewBoxEquator);

					axis.append("line")
							.attr("class", "beadString-axis")
							.attr("x1", axis_offset - 2)
							.attr("x2", axis_offset - 2)
							.attr("y1", viewBoxEquator - 10)
							.attr("y2", viewBoxEquator + 10);

					axis.append("line")
							.attr("class", "beadString-axis")
							.attr("x1", viewBoxWidth - axis_offset + 2)
							.attr("x2", viewBoxWidth - axis_offset + 2)
							.attr("y1", viewBoxEquator - 10)
							.attr("y2", viewBoxEquator + 10);
			}
			function calculateRadius(width, count, space){
					return (width / (count + space)) / 2
			}
			function initChart(){
				console.log(history[0])
				bead_string_items = container.selectAll(".beadString-chart");
				bead_string_items
						.data(history[0])
						.join(
								enter => enter.each(function(d){
										var chart = enterCharts(select(this));
										updateBeads(chart.select('.bead-container'));
										updateStrings(chart);
								}),
								update => {
										update.each(function(){
												select(this).attr("id", d => d.name);
										});
										updateBeads(update.select('.bead-container'));
										updateStrings(update);
								},
								exit => exit.each(function(d){
										select(this.parentNode).transition().style("opacity", 0).style("transform", "translate(100px,0)").remove();
								})
						);
			}
			function enterCharts(enter){
					var axis;
					var wrapper = enter.append("div")
									.attr("class", "beadString-wrapper")
									.attr("id", d => `${d.name}-wrapper`);
					var chart = wrapper.append("svg")
									.attr("id", d => d.name)
									.attr("class", "beadString-chart")
									.attr("height", "50%")
									.attr("width", "100%")
									.attr("viewBox", viewBoxDimensions)
									.on("mousedown", listen)
									.on("touchstart", listen)
									.on("mousemove", throttle(move, 10))
									.on("touchmove", throttle(move, 10))
									.on("touchend", ignore)
									.on("touchleave", ignore)
									.on("mouseleave", ignore)
									.on("mouseup", ignore);
					var menu = wrapper.append("div")
									.attr("class", "chart-menu");

					axis = chart.append("g")
									.attr("class","axis-container");

					chart.append("g")
							 .attr("class","bead-container");

					chart.append("rect")
							.attr("class", "drawing-rect")
							.attr("width", 0)
							.attr("height", 0)
							.attr("x", 0)
							.attr("y", 0);

					buildAxis(axis);
					return chart;
			}
			function updateBeads(container){
					var beads = container.selectAll(".bead")
											.data(d => {
													return d.beads;
											});
					beads.attr("cx", d => d.center + d.padding)
							.attr("class", d => `bead ${d.colour}`)
							.attr("cx", d => d.center + d.padding)
							.attr("cy", viewBoxEquator)
							.attr("r", d => d.radius);
					beads.exit().remove();
					beads.enter().append("circle")
							.attr("class", d => `bead ${d.colour}`)
							.attr("cx", d => d.center + d.padding)
							.attr("cy", viewBoxEquator)
							.attr("r", d => d.radius);
			}
			function updateStrings(container){
					var update = container.selectAll(".arc_group")
											.data(d => {
													var strings = updateAllStrings(d);
													var data = strings.map((a, i) => { 
															return { ...a, "index": i, "height": height(d,a,i) } 
													});
													return data;
											});
					var updateArc = update.select(".drawing-arc");
					var updateStart = update.select(".start");
					var updateEnd = update.select(".end");
					var updateTextBackground = update.select(".text-background");
					var updateText = update.select(".text");
					var updateExtent = update.select(".extent-rect");

					var updateExit = update.exit();
					var enter = update.enter().append("g");

					var arc_group = enter.attr("class", "arc_group")
															 .attr("id", (d,i) => `arc_group_${i}`)
															 .classed("shared_connections", d => d.sharedConnections.length);

					update.classed("shared_connections", d => d.sharedConnections.length);
					updateArc.attr("id", (d,i) => `${container.attr("id")}drawing-arc_${i}`).attr("d", d => path(d));
					updateStart.attr("points", d => triangle(d.points[0], markerRadius, d.height))
									.attr("class", (d, i) => markerClass(d,i,"start"));
					updateEnd.attr("points", d => triangle(d.points[1], markerRadius, d.height))
									.attr("class", (d, i) => markerClass(d,i,"end"));
					updateTextBackground.attr("cx", d => textPoint(d)[0])
															.attr("cy", getArcCenter);
					updateText.attr("x", d => textPoint(d)[0])
									.attr("y", getArcCenter)
									.text(d => d.extent);
					updateExtent.attr("x", d => Math.min(d.points[0][0].x, d.points[1][0].x))
											.attr("y", d => viewBoxEquator - d.radius)
											.attr("height", d => d.radius * 2)
											.attr("width", d => Math.max(d.points[1][0].x, d.points[0][0].x) - Math.min(d.points[0][0].x, d.points[1][0].x));

					updateExit.remove();

					container.selectAll(".drawing-line").remove();
					container.selectAll(".marker").remove();

					arc_group.append("path")
									.attr("class", "drawing-arc")
									.attr("id", (d,i) => `drawing-arc_${i}`)
									.attr("d", d => path(d));
					arc_group.append("polygon")
									.attr("points", d => triangle(d.points[0], markerRadius, d.height))
									.attr("class", (d, i) => markerClass(d,i,"start"));
					arc_group.append("polygon")
									.attr("points", d => triangle(d.points[1], markerRadius, d.height))
									.attr("class", (d, i) => markerClass(d,i,"end"));
					arc_group.append("circle")
									.attr("class", "text-background")
									.attr("cx", d => textPoint(d)[0])
									.attr("cy", getArcCenter)
									.attr("r", textBackgroundRadius);
					arc_group.append("text")
									.attr("class", "text hidden-element")
									.attr("x", d => textPoint(d)[0])
									.attr("y", getArcCenter)
									.text(d => d.extent);
					arc_group.append("rect")
									.attr("class", "extent-rect")
									.attr("x", d => Math.min(d.points[0][0].x, d.points[1][0].x))
									.attr("y", d => viewBoxEquator - d.radius)
									.attr("height", d => d.radius * 2)
									.attr("width", d => Math.max(d.points[1][0].x, d.points[0][0].x) - Math.min(d.points[0][0].x, d.points[1][0].x))
									.on("mousedown", function(){
											select(this.parentNode).classed("hide-beads", !select(this.parentNode).classed("hide-beads"))
									})
									.on("touchstart", function(){
											select(this.parentNode).classed("hide-beads", !select(this.parentNode).classed("hide-beads"))
									});
			}
			function triangle(d, r, height){
					var dir = height < viewBoxEquator ? 1 : -1;
					return `${d[0].x},${d[1] + (r*3*dir)} ${d[0].x - r},${d[1]} ${d[0].x + r},${d[1]}`
			}
			function height(data,d,i){
				console.log("height",d)
					var y1 = d.points[0][1];
					var x1 = d.points[0][0].index;
					var x2 = d.points[1][0].index;
					var upperHeights = [0.02, 0.15, 0.35];
					var lowerHeights = [0.98, 0.85, 0.65];
					var around = data.strings.filter((x, j) => {
							var start = x.points[0][0].index;
							var end = x.points[1][0].index;
							var isBetween = (start <= x1 && end > x2) || (start < x1 && end >= x2);
							var result = isBetween && (j !== i) && (y1 === x.points[0][1]);
							return result;
					});
					var within = data.strings.filter((x, j) => {
							var start = x.points[0][0].index;
							var end = x.points[1][0].index;
							var isBetween = (start >= x1 && end < x2) || (start > x1 && end <= x2);
							var result = isBetween && (j !== i) && (y1 === x.points[0][1]);
							return result;
					});
					var isWithin = within.length > 0;
					var isAround = around.length > 0;
					var heightIndex = isAround ? (isWithin ? 1 : 2) : (isWithin ? 0 : 1);
					var arcOffset = y1 < viewBoxEquator ? upperHeights[heightIndex] : lowerHeights[heightIndex];
					var height = arcOffset * viewBoxHeight;
					return height;
			}
			function deleteString(evt){
					var target = select(evt.target.parentNode.parentNode.parentNode.parentNode).select(".beadString-chart").attr("id");
					var deleteIndex = bead_strings.findIndex(d => d.name === target);
					var newCharts = [...bead_strings.slice(0, deleteIndex), ...bead_strings.slice(deleteIndex + 1)];
					closeAllStringMenus();
					executeHistoryUpdate(JSON.parse(JSON.stringify(newCharts)));
					initChart();
			}
			function removeArcs(evt, removing){
					var target = select(evt.target).datum();
					var chart = select(`#${target.name}-wrapper`);
					var isRemoving = removing === undefined ? !chart.classed("remove_arcs") : removing;
					chart.classed("remove_arcs", isRemoving);
			}
			function toggleNumbers(evt, removing){
					var target = select(evt.target).datum();
					var chart = select(`#${target.name}-wrapper`);
					chart.classed("hide_numbers", !chart.classed("hide_numbers"));
			}
			function getArcCenter(){
					var myarc = select(this.parentNode).select(".drawing-arc").node();
					var pathLen = myarc.getTotalLength();
					var pathDistance = pathLen * 0.5;
					var midpoint = myarc.getPointAtLength(pathDistance);
					return midpoint.y;
			}
			function path(d){
					var x1 = d.points[0][0].x;
					var y1 = d.points[0][1];
					var x2 = d.points[1][0].x;
					var y2 = d.points[1][1];
					var x3 = (x1 + x2) / 2;
					var x4 = (x1 + x3) / 2;
					var x5 = (x2 + x3) / 2;
					var y3 = d.height;
				console.log(d);
					return `M ${x1} ${y1} C ${x4} ${y3}, ${x5} ${y3}, ${x2} ${y2}`;
			}
			function markerClass(d,i,end){
					var cls = `point ${end}`;
					var grabbed = end === 'start' ? 0 : 1;
					var isGrabstring = grabString === i;
					var isGrabend = grabEnd === grabbed;
					var isGrabbing = isGrabstring && isGrabend;
					cls = isGrabbing ? `${cls} grabbing` : cls;
					return cls;
			}
			function textPoint(d){
					var x1 = d.points[0][0].x;
					var y1 = d.points[0][1];
					var x2 = d.points[1][0].x;
					var above = y1 < viewBoxEquator;
					var arcOffset = above ? 0.25 : 0.8;
					var x3 = (x1 + x2) / 2;
					var y3 = arcOffset * viewBoxHeight;
					return [x3,y3];
			}
			function listen (e) {
					var targetClass = [...e.target.classList];
					var point = targetClass.includes("point");
					var bead = targetClass.includes("bead");
					var arc = targetClass.includes("drawing-arc");
					var text = targetClass.includes("text-background");
					var action = point ? 'pointGrab' : bead ? 'beadGrab' : arc ? 'arcGrab' : text ? 'textToggle' : 'lineDraw';
					var parentNode = select(e.target).node().parentNode;
					currentBeadString = history[0].find(d => select(this).datum().name === d.name);
					e = touchEvents.includes(e.type) ? e.touches[0] : e;
					select(this).select(".drawing-rect").classed(hide_class, true);

					switch (action) {
							case 'pointGrab':
									var grab = grabPoint.bind(this);
									grab(e);
									break;

							case 'lineDraw':
									var clickPoint = pointer(e, this);
									var distanceFromMiddle = Math.abs(clickPoint[1] - viewBoxEquator);
									if(distanceFromMiddle < drawingSpace){
											var draw = drawLine.bind(this);
											draw(e);
									}
									break;

							case 'beadGrab':
									var drag = dragBead.bind(this);
									drag(e);
									break;

							case 'textToggle':
									if(select(parentNode.parentNode).classed("remove_arcs")){
											removeString(grabString, grabChart);
									}else{
											toggleHide(select(parentNode).select(".text"));
									}
									break;

							case 'arcGrab':
									var grab = touchArc.bind(this);
									grab(e);
									break;

					}
			}
			function touchArc(e){
					var chartData = select(this).datum();
					var target = select(e.target);
					var targetData = target.datum();
					var parentNode = target.node().parentNode;
					var svgSelect = select(parentNode.parentNode);

					grabString = targetData.index;
					grabChart = chartData.name;

					if(select(svgSelect.node().parentNode).classed("remove_arcs")){
							removeString(grabString, grabChart);
					}else{
							select(parentNode).classed("hide-beads", !select(parentNode).classed("hide-beads"))
					}
			}
			function grabPoint(e){
					var chartData = select(this).datum();
					var target = select(e.target);
					var targetData = target.datum();
					var targetClass = target.attr("class");
					var parentNode = target.node().parentNode;

					grabString = targetData.index;
					grabChart = chartData.name;

					select(parentNode).classed("grabbed", true);
					startDrag = pointer(e, this);
					moveAction = 'dragging';
					grabEnd = targetClass.includes("end") ? 1 : targetClass.includes("start") ? 0 : 'both';
					updateHistory(JSON.parse(JSON.stringify(bead_strings)));
			}
			function removeString(string, chart){
					var chartIndex = bead_strings.findIndex(d => d.name === chart);
					var newChart = {...bead_strings[chartIndex]};
					newChart.strings = [...newChart.strings.slice(0,string),...newChart.strings.slice(string+1)];
					bead_strings = [...bead_strings.slice(0,chartIndex),newChart,...bead_strings.slice(chartIndex+1)];
					executeHistoryUpdate(bead_strings);
					initChart();
			}
			function drawLine(e){
					var clickPoint = pointer(e, this);
					moveAction = 'drawing';

					drawingPath = select(this)
							.append("path")
							.attr("class", "drawing-line");
					extentCircle = select(this)
							.append("polygon")
							.attr("class", "extent-circle marker");
					startCircle = select(this)
							.append("polygon")
							.attr("class", "start-circle marker");

					tick(clickPoint, clickPoint, this);
			}
			function dragBead(e){
					var chartData = select(this).datum();
					var target = select(e.target);
					var targetData = target.datum();
					var beadIndex = targetData.index;
					var svgCoordinates = pointer(e, this);
					moveAction = 'beadMove';
					oldX = svgCoordinates[0];
					draggingBead = beadIndex;
					grabChart = chartData.name;
					select(this).select(".drawing-rect").classed(hide_class, true);
			}
			function ignore () {
					var chartIndex = select(this).datum().index;
					var data = bead_strings.find(d => d.index === chartIndex);
					switch (moveAction) {
							case 'drawing':
									if(startPoint && endPoint){
											completeDrawing(data);
											executeHistoryUpdate(JSON.parse(JSON.stringify(bead_strings)));
									}
									break;
							case 'dragging':
									completeDragging();
									updateHistory(JSON.parse(JSON.stringify(bead_strings)));
									break;
							case 'beadMove':
									completeBeadMove();
									updateHistory(JSON.parse(JSON.stringify(bead_strings)));
									break;
					}
					moveAction = false;
					startPoint = false;
					endPoint = false;
					drawingPath = null;
					select(this).select(".drawing-rect").classed(hide_class, true);
					initChart();
			}
			function completeDrawing(data){
					var newPoints = translatePoints([startPoint, endPoint], data);
					var isAnArc = newPoints.points[0][0] !== newPoints.points[1][0];
					if(isAnArc){
							var newData = addPointsToData(newPoints, data.index);
							bead_strings = updateBeadString(newData, bead_strings.findIndex(d => d.index === data.index));
					}
			}
			function completeDragging(){
					var chart = bead_strings.find(d => d.name === grabChart);
					var newChart = { ...chart };
					newChart.strings = mapConnections(newChart);
					grabEnd = false;
					moveAction = false;
					bead_strings = updateBeadString(newChart, bead_strings.findIndex(d => d.index === chart.index));
					select(".grabbed").classed("grabbed", false);
			}
			function completeBeadMove(){
					var chart = bead_strings.find(d => d.name === grabChart);
					var newChart = { ...chart };
					newChart.strings = mapConnections(newChart);
					bead_strings = updateBeadString(newChart, bead_strings.findIndex(d => d.index === chart.index));
			}
			function mapConnections(chart){
					return chart.strings.map((d,i) => {
							var sharedConnections = [];
							var dstart = d.points.find(p => p[0].position === "start");
							var dend = d.points.find(p => p[0].position === "end");
							var dlowerIndex = dstart[0].index;
							var dupperIndex = dend[0].index;
							// poop 1
							var dy = d.points[0][1];
							chart.strings.forEach((e,j) => {
									var str = e.points.find(p => p[0].position === "start");
									var nd = e.points.find(p => p[0].position === "end");
									var lowerIndex = str[0].index;
									var upperIndex = nd[0].index;
									var shareLower = dlowerIndex === lowerIndex;
									var shareUpper = dupperIndex === upperIndex;
									var shareUpperAndLower = dupperIndex === lowerIndex - 1;
									var shareLowerAndUpper = dlowerIndex === upperIndex + 1;
									var ey = e.points[0][1];
									var noGapIndexSpace = shareLowerAndUpper ? 
													chart.beads[dlowerIndex].padding === chart.beads[upperIndex].padding : shareUpperAndLower ? 
													chart.beads[lowerIndex].padding === chart.beads[dupperIndex].padding : true;
									var canPush = ey === dy && i !== j && noGapIndexSpace;
									if(shareLowerAndUpper && canPush){
											sharedConnections.push([j,0,1]);
									}else if(shareUpperAndLower && canPush){
											sharedConnections.push([j,1,0]);
									}else if(shareLower && canPush){
											sharedConnections.push([j,0,0]);
									}else if(shareUpper && canPush){
											sharedConnections.push([j,1,1]);
									}
							});
							d.sharedConnections = sharedConnections;
							d.radius = chart.beads[0].radius;
							return d;
					});
			}
			function updateBeadString(newData, index){
					var newBeadString = [
							...bead_strings.slice(0, index),
							newData,
							...bead_strings.slice(index + 1)
					];
					return newBeadString;
			}
			function executeHistoryUpdate(newBeadString, resetFuture = true){
					historyIterate += 1;
					var historylog = newBeadString.map(d => { d.history = historyIterate; return d });
					bead_strings = newBeadString;
					history = [[...JSON.parse(JSON.stringify(historylog))], ...JSON.parse(JSON.stringify(history))];
					future = resetFuture ? [] : future;
			}
			var updateHistory = debounce(executeHistoryUpdate, historyDebounce);
			function addPointsToData(points, di){
					var data = { ...bead_strings.find(d => d.index === di) };
					data.strings.push({...points});
					data.strings = mapConnections(data);
					return data;
			}
			function updateAllStrings(data){
					var updatedData = { ...data };
					var updatedStrings = updatedData.strings.map(d => {
							var newData = { ...d };
							newData.points = newData.points.map(e => { 
									var newPoints = [...e];
									newPoints[0] = indexToX(e[0], updatedData);
									return newPoints;
							})
							return newData
					});
					return updatedStrings;
			}
			function indexToX(point, data){
					var isAPoint = point.hasOwnProperty("index");
					var updated = isAPoint ? dynamicTransfer(point, data) : { "x": point };
					return updated;
			};
			function dynamicTransfer(point, data){
					var bead = data.beads[point.index];
					var x = bead[point.position] + bead.padding;
					var newData = { ...point };
					newData.x = x;
					return newData;
			}
			function translatePoints(pts, data){
					var hasExactPoint = pts[0].length === 3;
					var pt1 = hasExactPoint ? pts[0][2] : typeof pts[0][0] === 'object' ? pts[0][0].x : pts[0][0];
					var pt2 = hasExactPoint ? pts[1][2] : typeof pts[1][0] === 'object' ? pts[1][0].x : pts[1][0];
					var p1 = pt1 <= pt2 ? pt1 : pt2;
					var p2 = p1 === pt1 ? pt2 : pt1;
					var c1 = closestX(p1, data, "start", hasExactPoint);
					var c2 = closestX(p2, data, "end", hasExactPoint);
					var y1 = closestY(pts[0][1], data);
					var extent = calculateExtent(c1,c2);
					var translated = {
							'points': [[c1,y1], [c2, y1]],
							'extent': extent
					};
					return translated;
			}
			function calculateExtent(c1, c2){
					var start = c1.index < c2.index ? c1 : c2;
					var end = c1.index < c2.index ? c2 : c1;
					var startOffset = start.position === 'start' ? 1 : 0;
					var endOffset = end.position === 'start' ? -1 : 0;
					var offset = startOffset + endOffset;
					return Math.abs(Math.abs(c1.index - c2.index) + offset);
			}
			function move(e){
					e = touchEvents.includes(e.type) ? e.touches[0] : e;
					currentBeadString = history[0].find(d => select(this).datum().name === d.name);
					switch (moveAction) {
							case 'drawing':
									var drawMove = moveDraw.bind(this);
									drawMove(e);
									break;

							case 'dragging':
									moveDrag(e);
									break;

							case 'beadMove':
									var beadMove = moveBead.bind(this);
									beadMove(e);
									break;

							default:
									var svgCoordinates = pointer(e, this);
									beadHighlight(svgCoordinates,svgCoordinates,this);
									break;
					}
			}
			function moveDraw(e){
					var svgCoordinates = pointer(e, this);
					endPoint = svgCoordinates;

					if(startPoint){
							tick(startPoint, endPoint, this);
					}else{
							startPoint = svgCoordinates;
					}
			}
			function moveDrag(e){
					var svgCoordinates = pointer(e, this);
					updateGrabbedPoint(svgCoordinates, select(e.target));
			}
			function moveBead(e){
					var chartData = select(this).datum();
					var chartIndex = bead_strings.findIndex(d => d.name === chartData.name);
					var beadIndex = draggingBead;
					var svgCoordinates = pointer(e, this);
					var moving = svgCoordinates[0] < oldX ? '<=' : '>=';
					var change = Math.round(svgCoordinates[0] - oldX);
					var newData = {...chartData };
					var newPadding = newData.beads[beadIndex].padding + change;
					oldX = svgCoordinates[0];
					newData.beads = newData.beads.map((d, i) => {
							var isMoveable = operators[moving](d.index, beadIndex);
							var expectedDistance = (d.radius * 2) * Math.abs(i - beadIndex);
							var targetPosition = newData.beads[beadIndex].center + newData.beads[beadIndex].padding;
							var thisPositiong = d.center + d.padding;
							var actualDistance = Math.abs(targetPosition - thisPositiong);
							var itsMe = beadIndex === i;
							var distanceDifference = actualDistance - expectedDistance;
							var isTouching = distanceDifference < collisionDetectionSpace || itsMe;
							var totalMove = isMoveable && isTouching ? newPadding : d.padding;
							var direction = totalMove > 0 ? 1 : -1;
							var movingSpace = (axis_width - (newData.beads.length * 2 * d.radius)) / 2;
							var maxOffset = (movingSpace - d.radius);
							d.padding = Math.abs(totalMove) > maxOffset ? maxOffset * direction : totalMove;
							return d;
					});
					bead_strings = updateBeadString(newData, chartIndex);
					initChart();
			}
			function updateGrabbedPoint(coor, target){
					var chart = bead_strings.find(d => d.name === grabChart);
					var newChart = JSON.parse(JSON.stringify(chart));
					var sharedConnections = newChart.strings[grabString].sharedConnections;
					var newPoints = [...newChart.strings[grabString].points];
					var chartRadius = newChart.beads[0].radius;
					var totalBeads = newChart.beads.length;
					var changed = false;
					var changeDrag = coor[0] - startDrag[0];
					var change = changeDrag > 0 ? 1 : -1;
					var goingRight = change === 1;
					var goingLeft = change === -1;
					var isLowerEnd = newPoints[0][0].index > 0;
					var isUpperEnd = newPoints[1][0].index < totalBeads - 1;
					var draggedBeadLength = Math.abs(changeDrag) > chartRadius * 2;
					var lowerExtent = JSON.parse(JSON.stringify(newPoints[0][0]));
					var upperExtent = JSON.parse(JSON.stringify(newPoints[1][0]));
					var newLowerExtent = lowerExtent.index + change;
					var newUpperExtent = upperExtent.index + change;
					var extents = [newLowerExtent, newUpperExtent];

					switch(grabEnd) {
							case 'both':
									if(draggedBeadLength && 
											( (isUpperEnd && goingRight) || 
												(isLowerEnd && goingLeft) )){
											newPoints[0][2] = newLowerExtent;
											newPoints[1][2] = newUpperExtent;
											startDrag = coor;
											changed = true;
											newChart.strings[grabString] = translatePoints(newPoints, chart);
									}
									break;

							default:
									var end = newPoints[grabEnd][0].x <= newPoints[1 - grabEnd][0].x ? "start" : "end";
									var otherEnd = newPoints[1 - grabEnd][0].position;
									var switchPositions = end === otherEnd;
									var otherPoint = switchPositions ? otherEnd === "start" ? "end" : "start" : otherEnd;
									var oldIndex = newPoints[1 - grabEnd][0].index;
									var newIndex = switchPositions ? otherEnd === "start" ? oldIndex - 1 : oldIndex + 1 : oldIndex;
									newPoints[grabEnd][0] = closestX(coor[0], newChart, end, false);
									newPoints[1 - grabEnd][0] = closestX(newIndex, newChart, otherPoint, true);
									newChart.strings[grabString].points = newPoints;
									newChart.strings[grabString].extent = calculateExtent(newPoints[0][0], newPoints[1][0]);
									sharedConnections.forEach(d => {
											var connectionIndex = d[0];
											var myEndpoint = d[1];
											var connectionEndpoint = d[2];
											var pointOne = newChart.strings[connectionIndex].points[connectionEndpoint][0];
											var pointTwo = newChart.strings[connectionIndex].points[1 - connectionEndpoint][0];
											var connectionEnd = pointOne.x <= pointTwo.x ? "start" : "end";

											var disconnectionEnd = pointTwo.position;
											var switchConnections = connectionEnd === disconnectionEnd;
											var otherConnection = switchConnections ? disconnectionEnd === "start" ? "end" : "start" : disconnectionEnd;
											var disconnectIndex = pointTwo.index;
											var updatedIndex = switchConnections ? disconnectionEnd === "start" ? disconnectIndex - 1 : disconnectIndex + 1 : disconnectIndex;

											var connectionOffset = end === connectionEnd ? 0 : myEndpoint - connectionEndpoint;
											var index = newPoints[grabEnd][0].index + connectionOffset;
											if(myEndpoint === grabEnd){
													newChart.strings[connectionIndex].points[connectionEndpoint][0] = closestX(index, newChart, connectionEnd, true);
													newChart.strings[connectionIndex].points[1 - connectionEndpoint][0] = closestX(updatedIndex, newChart, otherConnection, true);
													newChart.strings[connectionIndex].extent = calculateExtent(newChart.strings[connectionIndex].points[0][0], newChart.strings[connectionIndex].points[1][0]);
											}
									});
									changed = true;
									break;
					}
					if(changed){
							bead_strings = updateBeadString(newChart, bead_strings.findIndex(d => d.index === chart.index));
							history[0] = bead_strings;
							initChart();
					}
			}
			function closestY(y, data){
					var gap = activeRadius.minimum * 2;
					var closest = y <= viewBoxEquator ? viewBoxEquator - gap : viewBoxEquator + gap;
					console.log("closest", activeRadius)
					return closest;
			}
			function closestX(ex, data, position, hasExactPoint){
					if(hasExactPoint){
							var selectedBead = data.beads[ex];
					}else{
							var x = typeof ex === 'object' ? ex.x : ex;
							var within = data.beads.find(d => {
									var isBetween = x > (d.start + d.padding) && x < (d.end + d.padding);
									var isBeforeStart = x < (d.start + d.padding) && d.index === 0;
									var isBeyondEnd = x > (d.end + d.padding) && d.index === data.beads.length - 1;
									var found = isBetween || isBeforeStart || isBeyondEnd;
									return found;
							});
							var closest = data.beads.reduce(function(prev, curr) {
									var currPos = curr.center + curr.padding;
									var prevPos = prev.center + prev.padding;
									return (Math.abs(currPos - x) < Math.abs(prevPos - x) ? curr : prev);
							});
							var selectedBead = typeof within === "undefined" ? closest : within;
					}
					var anchor = selectedBead[position] + selectedBead.padding;
					return {'x': anchor, 'index': selectedBead.index, 'position': position};
			}
			function tick(start, end, that){
					var x1 = start[0] < end[0] ? start[0] : end[0];
					var x2 = x1 === start[0] ? end[0] : start[0];
					var closestStart = closestX(x1, currentBeadString, "start");
					var closestEnd = closestX(x2, currentBeadString, "end");
					var startX = closestStart.x;
					var endX = closestEnd.x;
					var startY = closestY(start[1], currentBeadString);
					var endY = startY;
					var rectX = Math.min(startX,endX);
					var radius = currentBeadString.beads[0].radius;
					var d = {points:[[closestStart,startY],[closestEnd,endY]]}
					d.height = height(currentBeadString, d, currentBeadString.strings.length);

					drawingPath.attr("d", path(d));
					startCircle.attr("points", triangle(d.points[0], markerRadius, d.height));
					extentCircle.attr("points", triangle(d.points[1], markerRadius, d.height));
					select(that).select(".drawing-rect").attr("x", rectX)
							.attr("y", viewBoxEquator - radius)
							.attr("height", radius * 2)
							.attr("width", Math.abs(endX - startX))
							.classed(hide_class, false);
			}
			function beadHighlight(start, end, that){
					var distanceFromMiddle = Math.abs(start[1] - viewBoxEquator);
					var isInHighlightRange = distanceFromMiddle < drawingSpace;
					if(start[0] > axis_offset && start[0] < viewBoxWidth - axis_offset && isInHighlightRange){
							var x1 = start[0] < end[0] ? start[0] : end[0];
							var x2 = x1 === start[0] ? end[0] : start[0];
							var closestStart = closestX(x1, currentBeadString, "start");
							var closestEnd = closestX(x2, currentBeadString, "end");
							var startX = closestStart.x;
							var endX = closestEnd.x;
							var rectX = startX < endX ? startX : endX;
							var radius = currentBeadString.beads[0].radius;

							select(that).select(".drawing-rect").attr("x", rectX)
									.attr("y", viewBoxEquator - radius)
									.attr("height", radius * 2)
									.attr("width", Math.abs(endX - startX))
									.classed(hide_class, false);
					}else{
							select(that).select(".drawing-rect").classed(hide_class, true);
					}
			}

			const throttle = (func, limit) => {
					let inThrottle
					return function() {
						const args = arguments
						const context = this
						if (!inThrottle) {
							func.apply(context, args)
							inThrottle = true
							setTimeout(() => inThrottle = false, limit)
						}
					}
			}
			function debounce(func, wait, immediate) {
				var timeout;
				return function() {
					var context = this, args = arguments;
					var later = function() {
						timeout = null;
						if (!immediate) func.apply(context, args);
					};
					var callNow = immediate && !timeout;
					clearTimeout(timeout);
					timeout = setTimeout(later, wait);
					if (callNow) func.apply(context, args);
				};
			};

		});
	}
	
  	beadString.data = function(data) {
			if (!arguments.length) return data;
			({bead_count,colours_per} = data);
			console.log("data", addBeadStringToSVG)
			if (typeof addBeadStringToSVG === 'function') addBeadStringToSVG(bead_count,colours_per,true);
			return beadString;
		};

	return beadString;
};