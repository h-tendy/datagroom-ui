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
1. Unit-testing is a must. That's the main reason for upgrading everything. Without unit-testing, it is hard to leverage AI! 
1. Use `react-router-dom` v6+ and use the latest hooks-based approach for routing. Have to learn what this is, first. 


## References
1. https://medium.com/naukri-engineering/migrating-a-react-16-application-to-react-18-with-webpack-5-435d044b846 - Use Approach 1. 
1. https://github.com/ngduc/react-tabulator/blob/0.13.8/src/ReactTabulator.tsx - Reference for `react-tabulator` to be replaced.