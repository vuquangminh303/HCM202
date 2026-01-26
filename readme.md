# 🌍 Hành Trình Tư Tưởng Hồ Chí Minh

Interactive visualization of Ho Chi Minh Thought journey across the globe.

## Overview

![image](./demo.gif)

`hcm-thought-globe` is a React + ThreeJS application that visualizes the revolutionary journey of President Ho Chi Minh with an interactive globe. Static historical data is loaded at runtime from JSON files. Globe visualizations are rendered using the [`react-globe`][react-globe-github] package.

This project showcases the historical milestones of Ho Chi Minh's revolutionary journey across different countries and time periods, highlighting his dedication to Vietnam's independence and freedom.

## Local Development

To run the application locally:

```sh
git clone YOUR_REPOSITORY_URL

cd hcm-thought-globe
npm install && npm start
```

You can configure the globe visuals (e.g. globe texture, glow color, zoom behaviors) by editing the [`config.js`](./src/config.js) file. For more resources on how to configure these options, please refer to the `react-globe` [docs][react-globe-docs].

To update the historical events data, simply modify the `src/data/hcm_data.json` file with new events, locations, and multimedia content.

You should now be able to test your changes locally with the `npm start` command!

## Data Structure

The application uses a static JSON data structure with the following fields:
- `phase`: The phase of the journey (1-5)
- `year`: The year when the event occurred
- `location`: Name of the location
- `coordinates`: Geographic coordinates as [latitude, longitude]
- `eventName`: Name of the historical event
- `description`: Detailed description of the event
- `mediaUrl`: Path to media (images/videos)
- `sourceMedia`: Source of the media content
- `quoteSource`: Source of any quoted content
- `templateType`: Display template (normal, grid, story_scroll)

<!-- Links -->
[react-globe-github]: https://github.com/chrisrzhou/react-globe
[react-globe-docs]: https://react-globe.netlify.com/
