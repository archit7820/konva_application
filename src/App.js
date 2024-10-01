import React, { useEffect, useRef, useState } from 'react';
import Konva from 'konva';
import "./App.css";

function App() {
  const stageRef = useRef(null);
  const layerRef = useRef(null);
  const [textNodes, setTextNodes] = useState([]); // Store multiple text nodes
  const [images, setImages] = useState([]); // Store added images
  const [textValue, setTextValue] = useState('Editable Text');
  const [fontColor, setFontColor] = useState('black');
  const [fontStyle, setFontStyle] = useState('normal');
  const [videoElement, setVideoElement] = useState(null); // Store video reference
  const [konvaVideo, setKonvaVideo] = useState(null); // Store Konva video reference

  // Stage and layer initialization
  useEffect(() => {
    const stage = new Konva.Stage({
      container: stageRef.current,
      width: window.innerWidth,
      height: window.innerHeight,
    });

    const layer = new Konva.Layer();
    stage.add(layer);
    layerRef.current = layer;

    // Add initial text node
    addTextNode(textValue);

    layer.draw();
  }, []);

  // Function to add a text node
  const addTextNode = (text) => {
    const layer = layerRef.current;

    const textNode = new Konva.Text({
      x: 150,
      y: 150,
      text: text,
      fontSize: 30,
      fill: fontColor,
      fontStyle: fontStyle,
      draggable: true,
    });

    layer.add(textNode);
    const transformer = new Konva.Transformer({
      nodes: [textNode],
      enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right'],
      boundBoxFunc: (oldBox, newBox) => {
        if (newBox.width < 30) {
          return oldBox;
        }
        return newBox;
      },
    });

    layer.add(transformer);

    textNode.on('click', () => {
      transformer.nodes([textNode]);
      layer.draw();
    });

    // Store the text node and transformer
    setTextNodes((prev) => [...prev, { node: textNode, transformer }]);
    layer.draw();
  };

  // Image upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new window.Image();
        img.src = reader.result;
        img.onload = () => {
          addImageToLayer(img);
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const addImageToLayer = (img) => {
    const layer = layerRef.current;

    const konvaImage = new Konva.Image({
      x: 50,
      y: 50,
      image: img,
      draggable: true,
      width: 200,
      height: 200,
    });

    layer.add(konvaImage);
    const transformer = new Konva.Transformer({
      nodes: [konvaImage],
      enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right'],
      boundBoxFunc: (oldBox, newBox) => {
        if (newBox.width < 30 || newBox.height < 30) {
          return oldBox; // Prevent shrinking below a minimum size
        }
        return newBox;
      },
    });

    layer.add(transformer);

    konvaImage.on('click', (e) => {
      transformer.nodes([konvaImage]);
      layer.draw();
      e.cancelBubble = true; // Prevent click event from bubbling up
    });

    konvaImage.on('transform', () => {
      konvaImage.setAttrs({
        width: konvaImage.width() * konvaImage.scaleX(),
        height: konvaImage.height() * konvaImage.scaleY(),
        scaleX: 1,
        scaleY: 1,
      });
      layer.draw();
    });

    // Add the image and its transformer to the images array for later reference
    setImages((prevImages) => [...prevImages, { konvaImage, transformer }]);
    layer.draw();
  };

  // Handle text change
  const handleTextChange = (e) => {
    const newText = e.target.value;
    setTextValue(newText);
    // Update existing text nodes
    textNodes.forEach(({ node }) => {
      node.text(newText);
    });
    layerRef.current.draw();
  };

  // Change font color
  const handleFontColorChange = (e) => {
    const color = e.target.value;
    setFontColor(color);
    textNodes.forEach(({ node }) => {
      node.fill(color);
    });
    layerRef.current.draw();
  };

  // Change font style
  const handleFontStyleChange = (e) => {
    const style = e.target.value;
    setFontStyle(style);
    textNodes.forEach(({ node }) => {
      node.fontStyle(style);
    });
    layerRef.current.draw();
  };

  // Remove all text nodes and transformers
  const removeText = () => {
    textNodes.forEach(({ node, transformer }) => {
      node.destroy(); // Remove text node
      transformer.destroy(); // Remove transformer
    });
    setTextNodes([]); // Clear text nodes array
    layerRef.current.draw();
  };

  // Remove images
  const removeImages = () => {
    images.forEach(({ konvaImage, transformer }) => {
      konvaImage.destroy(); // Remove images
      transformer.destroy(); // Remove transformer
    });
    setImages([]); // Clear images array
    layerRef.current.draw();
  };

  // Add text button
  const addText = () => {
    addTextNode('New Text');
  };

  // Video controls
  const addVideo = () => {
    const video = document.createElement('video');
    video.src = 'https://www.w3schools.com/html/mov_bbb.mp4'; // Replace with your video URL
    video.loop = true;
    video.muted = true; // Mute to autoplay on most browsers
    video.play();

    const konvaVideo = new Konva.Image({
      x: 0,
      y: 0,
      draggable: true,
      listening: true,
    });

    const updateFrame = () => {
      if (video.readyState >= 2) { // Ensure the video has enough data to display
        konvaVideo.image(video);
        konvaVideo.width(window.innerWidth);
        konvaVideo.height(window.innerHeight);
        layerRef.current.add(konvaVideo);
        layerRef.current.batchDraw();
      }
      requestAnimationFrame(updateFrame);
    };

    updateFrame();
    setVideoElement(video);
    setKonvaVideo(konvaVideo);
    layerRef.current.add(konvaVideo);
    layerRef.current.draw();
  };

  // Play and Pause video
  const toggleVideoPlayback = () => {
    if (videoElement) {
      if (videoElement.paused) {
        videoElement.play();
      } else {
        videoElement.pause();
      }
    }
  };

  // Move selected text nodes
  const moveTextNodes = (dx, dy) => {
    textNodes.forEach(({ node }) => {
      node.position({
        x: node.x() + dx,
        y: node.y() + dy,
      });
    });
    layerRef.current.draw();
  };

  // Handle directional button clicks
  const handleDirection = (direction) => {
    switch (direction) {
      case 'up':
        moveTextNodes(0, -10); // Move up
        break;
      case 'down':
        moveTextNodes(0, 10); // Move down
        break;
      case 'left':
        moveTextNodes(-10, 0); // Move left
        break;
      case 'right':
        moveTextNodes(10, 0); // Move right
        break;
      default:
        break;
    }
  };

  return (
    <div className='konva'>
      <div className='controllers'>

<div className='variable'>
        <input type="file" onChange={handleFileChange} />

<div className='text_color'>
        <input
        className='text_input'
          type="text"
          value={textValue}
          onChange={handleTextChange}
          placeholder="Enter text"
          style={{ zIndex: "9999" }}
        />
        <input
          type="color"
          value={fontColor}
          onChange={handleFontColorChange}
        />

</div>
        <select value={fontStyle} onChange={handleFontStyleChange} style={{  }}>
          <option value="normal">Normal</option>
          <option value="bold">Bold</option>
          <option value="italic">Italic</option>
        </select>
        </div>
        <div className='button' onClick={addText}>Add Text</div>
        <div className='button' onClick={removeText}>Remove Text</div>
        <div className='button' onClick={removeImages}>Remove Images</div>
        <div className='button' onClick={addVideo}>Add Video</div>
        <div className='button' onClick={toggleVideoPlayback}>Play/Pause Video</div>
        <div className="direction-buttons">
  <div className="direction-button" onClick={() => handleDirection('up')}>↑</div>
  <div className="direction-button" onClick={() => handleDirection('right')}>→</div>
  <div className="direction-button" onClick={() => handleDirection('down')}>↓</div>
  <div className="direction-button" onClick={() => handleDirection('left')}>←</div>
</div>

      </div>
      <div className="canvas" ref={stageRef} id="stage-container" style={{ border: '1px solid grey' }}>
      </div>
    </div>
  );
}

export default App;
