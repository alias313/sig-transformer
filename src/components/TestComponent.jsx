// src/components/TestComponent.jsx
import React, { useEffect } from 'react';

const TestComponent = () => {
  useEffect(() => {
    console.log("TestComponent useEffect is running!");
  }, []);

  return (
    <div>
      <h1>Test Component</h1>
    </div>
  );
};

export default TestComponent;
