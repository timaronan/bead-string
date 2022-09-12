(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('d3-axis'), require('d3-scale'), require('d3-selection'), require('d3-shape'), require('d3-transition')) :
	typeof define === 'function' && define.amd ? define(['exports', 'd3-axis', 'd3-scale', 'd3-selection', 'd3-shape', 'd3-transition'], factory) :
	(factory((global.d3 = global.d3 || {}),global.d3Axis,global.d3Scale,global.d3Selection,global.d3Shape));
}(this, (function (exports,d3Axis,d3Scale,d3Selection,d3Shape) { 'use strict';

var chaos = function() {
  var margin = {top: 30, right: 80, bottom: 70, left: 100};
	var height = 500;
	var width = 2200;
	var innerWidth = width - margin.left - margin.right;
	var innerHeight = height - margin.top - margin.bottom;
			
	var highlightKey = "";
	var duration = 1000;

	var updateLayout = null;
	var updateData = null;
	var updateKey = null;

	var data = [];
	var xKey = "";
	var xFormat = function(d){
		return d;
	};

	var xValues = data.map(item => xFormat(item[xKey]));
	var xRegions = xValues.reduce((acc, d) => {
		acc[d] = d in acc ? acc[d] + 1 : 1;
		return acc;
	}, {});
	var grabKey = function(d){
		return importantKeys.indexOf(xFormat(d[xKey])) >= 0 ? xFormat(d[xKey]) : "other";
	};
	var importantKeys = Object.keys(xRegions)
		.sort((a, b) => xRegions[b] - xRegions[a]).slice(0, 9);

	if(importantKeys.length < Object.keys(xRegions).length){
		importantKeys.push("other");
	}

	function chaos(selection){
		selection.each(function () {
			//parent DOM variables
			var dom = d3Selection.select(this);
			var svg = dom.append('svg');
			
			var shapes = svg.append('g').attr('class', 'shapes');
			var labels = svg.append('g').attr('class', 'labels');
			
			var lines = shapes.selectAll('g.line-shape').data(data);
			var xLabels = labels.selectAll('g.label').data(importantKeys);

			var linesEnter = lines.enter().append('g');
			var labelsEnter = xLabels.enter().append('g').attr('class', 'label');

			//axis related variables
			var x = null;
			var y = null;
			var xAxis = null;
			var yAxis = null;
			var xAxisGroup = null;
			var yAxisGroup = null;

			//line related variables
			var line$$1 = null;
			var area = null;
			var filterMerge = null;
			var name = null;

			//svg setup
			svg.attr('width', '100%')
			  .attr('height', '100%')
			  .attr('viewBox', '0 0 '+width+' '+height)
			  .attr('preserveAspectRatio', 'xMidYMid');

			//axis and scale creation
			x = d3Scale.scaleLinear()
			  .range([margin.left, innerWidth]);
			y = d3Scale.scaleLinear()
			  .range([innerHeight, margin.top]);

			x.domain([0, data.length]);
			y.domain([0, 1]);

			xAxis = d3Axis.axisLeft().scale(x);
			yAxis = d3Axis.axisLeft().scale(y);

			xAxisGroup = svg.append('g')
			  .attr('class', 'x axis')
			  .attr('transform', 'translate(0,' + innerHeight + ')')
			  .call(xAxis);
			yAxisGroup = svg.append('g')
			  .attr('class', 'y axis')
			  .attr('transform', 'translate('+ margin.left +',0)')
			  .call(yAxis);

			shapes.attr('class', 'shapes');
			linesEnter
				.attr('class', 'line-shape');
			
			addShapes(linesEnter);
			addLabels(labelsEnter);

			function addShapes(enterContainer){
				enterContainer.append('line')
					.attr('class', function(d){
						return grabKey(d) === highlightKey ? 'line highlight' : 'line';
					})
					.attr("x1", function(d){
						var random = x(data.length * Math.random());
						var center = width / 2;
						return grabKey(d) === highlightKey ? center : random;
					})
					.attr("x2", xAxisPlacement)
					.attr("y1", 0)
					.attr("y2", innerHeight);
				enterContainer.append('circle')
					.attr('class', 'line-point')
					.attr('r', 1)
					.attr("cy", innerHeight)
					.attr("cx", xAxisPlacement);
			}
			function addLabels(enterContainer){
				enterContainer.on('mouseover', function(evt, d){
					updateHighlight(d);
				});
				enterContainer.append("rect")
					.attr('class', 'label-background')
					.attr('x', d => x(getXAxisOffset(d)))
					.attr('y', innerHeight)
					.attr('height', margin.bottom)
					.attr('width', innerWidth / importantKeys.length);
				enterContainer.append("text")
					.attr('class', 'label-text')
					.attr('x', d => x(getXAxisOffset(d)) + ((innerWidth / importantKeys.length) / 2))
					.attr('y', innerHeight + (margin.bottom/2))
					.attr('dominant-baseline', 'middle')
					.attr('text-anchor', 'middle')
					.text(d => d);
			}

			function updateShapes(updateGroup){
				var updateLines = updateGroup.select('line.line');
				var updatePoints = updateGroup.select('circle.line-point');
				var shapesExit = updateGroup.exit();
				
				updateLines
					.attr('class', function(d){
						return grabKey(d) === highlightKey ? 'line highlight' : 'line';
					})
					.transition(duration)
					.attr("x1", function(d){
						var random = x(data.length * Math.random());
						var center = width / 2;
						return grabKey(d) === highlightKey ? center : random;
					})
					.attr("x2", xAxisPlacement);

				updatePoints
					.attr("cx", xAxisPlacement);

				shapesExit.remove();
			}
			function updateLabels(updateContainer){
				var updateBG = updateContainer.select('.label-background');
				var updateText = updateContainer.select('.label-text');
				var updateExit = updateContainer.exit();
				
				updateContainer.on('mouseover', function(evt, d){
					updateHighlight(d);
				});

				updateBG.attr('class', 'label-background')
					.attr('x', d => x(getXAxisOffset(d)))
					.attr('y', innerHeight)
					.attr('height', margin.bottom)
					.attr('width', innerWidth / importantKeys.length);
				updateText.attr('class', 'label-text')
					.attr('x', d => x(getXAxisOffset(d)) + ((innerWidth / importantKeys.length) / 2))
					.attr('y', innerHeight + (margin.bottom/2))
					.attr('dominant-baseline', 'middle')
					.attr('text-anchor', 'middle')
					.text(d => {
					return d
					});
				
				updateExit.remove();
			}

			function updateHighlight(key){
				var oldKey = highlightKey;
				highlightKey = key;
				shapes.selectAll('line.line')
					.attr('class', function(d){
						var cls = grabKey(d) === highlightKey ? 'line highlight' : 'line';
						return cls;
					})
					.transition()
					.attr("x1", function(d){
						var random = x(data.length * Math.random());
						var center = width / 2;
						var currentX1 = d3Selection.select(this).attr("x1");
						var lineKey = grabKey(d);
						return lineKey === highlightKey ? 
								width / 2 : lineKey === oldKey ? 
								random : currentX1;
					});

				return highlightKey;
			}

			function xAxisPlacement(d,i){
				var key = grabKey(d);
				var xValue = key;
				var xAxisOffset = getXAxisOffset(xValue);
				var reducedX = i / importantKeys.length;

				return x(xAxisOffset + reducedX);
			}
			function getXAxisOffset(d){
				var xAxisOffset = (importantKeys.indexOf(d) / importantKeys.length) * data.length;
				return xAxisOffset;
			}

			updateKey = function(){
				var updateLabelGroup = labels.selectAll('g.label').data(importantKeys);
				var updateShapeGroup = shapes.selectAll('g.line-shape').data(data);
				
				linesEnter = updateShapeGroup.enter().append('g').attr('class', 'line-shape');
				labelsEnter = updateLabelGroup.enter().append('g').attr('class', 'label');

				addShapes(linesEnter);
				addLabels(labelsEnter);
				
				updateShapes(updateShapeGroup);
				updateLabels(updateLabelGroup);
			};

		});
	}

  	chaos.layout = function(value) {
			if (!arguments.length) return {height:height,width:width,margin:margin};
			height = value.height || height;
			width = value.width || width;
			margin = value.margin || margin;
			innerWidth = width - margin.left - margin.right;
			innerHeight = height - margin.top - margin.bottom;
			if (typeof updateLayout === 'function') updateLayout();
			return chaos;
		};
	
  	chaos.data = function(value) {
			if (!arguments.length) return data;
			data = value;
			if (typeof updateData === 'function') updateData();
			return chaos;
		};
	
	chaos.key = function(key, value, format) {
		if (!arguments.length) return {highlightKey,xKey,xFormat,xValues,xRegions,importantKeys};
		
		highlightKey = value;
		xKey = key;
		xFormat = format;
		
		xValues = data.map(item => xFormat(item[xKey]));
		xRegions = xValues.reduce((acc, d) => {
			acc[d] = d in acc ? acc[d] + 1 : 1;
			return acc;
		}, {});
		importantKeys = Object.keys(xRegions)
			.sort((a, b) => xRegions[b] - xRegions[a])
			.slice(0, 9);

		if(importantKeys.length < Object.keys(xRegions).length){
			importantKeys.push("other");
		}
		
		if (typeof updateKey === 'function') updateKey();
		return chaos;
	};

	return chaos;
};

exports.chaos = chaos;

Object.defineProperty(exports, '__esModule', { value: true });

})));
