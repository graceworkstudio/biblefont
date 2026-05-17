import cv2
import os
from PIL import Image

def create_gif(video_path, start_time, end_time, output_name, resize_width=480, fps=7):
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Error opening video: {video_path}")
        return

    orig_fps = cap.get(cv2.CAP_PROP_FPS)
    start_frame = int(start_time * orig_fps)
    end_frame = int(end_time * orig_fps)
    
    # Calculate skip factor to match target fps
    skip = max(1, int(orig_fps / fps))
    
    cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)
    
    frames = []
    current_frame = start_frame
    while current_frame <= end_frame:
        ret, frame = cap.read()
        if not ret:
            break
        
        if (current_frame - start_frame) % skip == 0:
            # Convert BGR to RGB
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            img = Image.fromarray(frame_rgb)
            
            # Resize
            w, h = img.size
            aspect = h / w
            new_h = int(resize_width * aspect)
            img = img.resize((resize_width, new_h), Image.LANCZOS)
            
            # Keep high quality color palette (256 colors with dithering)
            img = img.convert('P', palette=Image.ADAPTIVE)
            
            frames.append(img)
            
        current_frame += 1

    cap.release()
    
    if frames:
        frames[0].save(
            output_name,
            save_all=True,
            append_images=frames[1:],
            duration=1000 // fps,
            loop=0,
            optimize=True
        )
        print(f"Created: {output_name} ({len(frames)} frames)")
    else:
        print(f"No frames found for {output_name}")

# Create output directory
os.makedirs('public/gifs', exist_ok=True)

video = 'public/biblezoom-tutorial2.mp4'
scenes = [
    (2, 15, 'public/gifs/tutorial-step1.gif'),
    (26, 35, 'public/gifs/tutorial-step2.gif'),
    (38, 45, 'public/gifs/tutorial-step3.gif')
]

for start, end, name in scenes:
    create_gif(video, start, end, name)
