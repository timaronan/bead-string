# d3-chaos v1.1.2

d3 v4 port of a sortable chaos line chart

## Installing

If you use NPM, `npm install d3-chaos`.

## API Reference

<a name="chaos" href="#chaos">#</a> d3.<b>chaos</b>()

Constructs a new default [chaos generator](#_chaos).

<a name="_chaos" href="#_chaos">#</a> <i>chaos</i>(<i>data</i>)

For example:

```js
var data = [{"gender":"Male","race":"unknown","date":"7/1/2012","COD":"Gunshot",},{"gender":"Male","race":"White","date":"3/9/2014","COD":"Gunshot",},{"gender":"Male","race":"Black","date":"3/5/2014","COD":"Gunshot",},{"gender":"Male","race":"unknown","date":"9/21/2012","COD":"Gunshot",},{"gender":"Male","race":"unknown","date":"8/3/2012","COD":"Gunshot",}]; 
var chaos = d3.chaos().data(data).key({xKey: "date", highlightKey: "2012", xLabelFormat: getYear});
var parent = d3.select('body').call(chaos);
```

<a name="chaos_layout" href="#chaos_layout">#</a> <i>chaos</i>.<b>layout</b>([<i>{width:width,height:height,margin{top:top,bottom:bottom,left:left,right:right}}</i>])

If *layout* is specified, sets the *layout* and returns this chaos generator. If *layout* is not specified, returns the current *layout*, which defaults to:  ```{margin:{top: 100, right: 80, bottom: 100, left: 10},width:1500, height:2000}```

<a name="chaos_key" href="#chaos_key">#</a> <i>chaos</i>.<b>keys</b>([<i>{top,middle,bottom}</i>])

If *key object* is specified, sets the *keys* and returns this chaos generator. If *key object* is not specified, returns the current *keys*, which are the keys for the range values, which include:  ```{xKey: "Key used for organizing the x-axis", highlightKey: "xKey value highlighted", xLabelFormat: "A function used for formatting the xKey values on the x-axis labels"}```
