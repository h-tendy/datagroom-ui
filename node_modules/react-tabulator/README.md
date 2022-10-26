# What's different in this fork?

I have two problems in my usage of the main component. 

1. I am offering editing of data using the editing features of `tabulator`. When I edit, I lose my scroll positions with the main component. To fix this, I added a wrapper component which wraps `ReactTabulator` and makes the required checks in `shouldComponentUpdate()` routine. Only when the appropriate props change, I return as `true`. So, when I normally edit the data, I always return `false` so that I don't lose scroll positions. For this, I don't actually need any changes to `react-tabulator` per se. 

1. There are other props, that I want to change and pass on the changed values to the `tabulator` table. However, I am unable to get that to work properly. Probably because the table is rendered only once when `componentDidMount()` routine. To fix this, I added a very hacky way to just re-render the table in the `componentDidUpdate()` routine: I simply `destroy()` the old table and re-render the new table by calling `componentDidMount()` again. This is sufficient for my purpose. I'm sure there is a better way to fix this maybe. 

