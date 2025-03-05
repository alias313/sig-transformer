import React, { useEffect } from 'react';

const Chart = () => {
  useEffect(() => {
    console.log("useEffect is running!");
  }, []);

  return (
    <div>
      <h1>React Chart Test Component</h1>
    </div>
  );
};

export default Chart;
