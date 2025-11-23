## Steps

1. Build the UI completely in a separate repo. 
1. Use latest CRA (Create React App) approach and add all the dependencies. 
1. Move `tabulator-tables` to be housed directly in the sources and not as an explicit dependency. 
1. Avoid using `react-tabulator` completely. Enhance and use `MyTabulator` to directly use `tabulator-tables`. Again, not as a node_module dependency. 
1. Pull all other custom dependencies directly into the UI sources. 
1. Continue to use the bootstrap admin template that is currently there. 
1. DO NOT use `redux` anymore. Simply use `state` and `props` correctly. Things like user/login info should be managed as `state` and `props` flowing from the top-most component `Root`. 
1. Simply do `async` io calls within a component and manage the info directly into the component's `state`. 
1. The `MyTabulator` should be able to render without too many other controls that we currently have. This should enable other use-cases. 
1. Use RTL (React Testing Library), MSW (Mock Service Worker), latest React. 

## References
1. https://medium.com/naukri-engineering/migrating-a-react-16-application-to-react-18-with-webpack-5-435d044b846 - Use Approach 1. 
1. 