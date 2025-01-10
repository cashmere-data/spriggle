'use client';

import { Box, Card, CardActionArea, CardContent, CardHeader } from "@mui/material";
import PlayerProgress from "./player-progress";
import PlayerControls from "./player-controls";
import PlayerCardActions from "./player-card-actions";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { AudioChapterManager } from './audio-manager';
import BookCoverImage from "@/components/book-cover-image";

export interface INav {
  order: number;
  label: string;
}

export interface IBookData {
  uuid: string;
  data: {
    title: string;
    creators: string[];
    nav: INav[];
  },
}

export default function MediaPlayer({bookData}: {bookData: IBookData}) {
  const params = useParams<{id: string, order: string}>();

  const totalLength = 10000;
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const audioManagerRef = useRef<AudioChapterManager | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    if(audioRef.current) {
      audioManagerRef.current = new AudioChapterManager(audioRef.current);
    }
  }, []);

  useEffect(() => {
    const loadChapter = async () => {
      if (!audioManagerRef.current) return;
      setIsLoading(true);
      await audioManagerRef.current.prepareChapter(params.id, parseInt(params.order));

      // console.log(audioManagerRef.current.getDuration())
      
      // setDuration(audioManagerRef.current.getDuration());
      setIsLoading(false);
    };

    loadChapter();
  }, [params.id, params.order]);

  const handlePlayPause = () => {
    if (!audioManagerRef.current) return;
    if(isPlaying) {
      audioManagerRef.current.pause();
    } else {
      audioManagerRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }
  
  const handleSeek = (newPosition: number) => {
    console.log(newPosition);
    
    if(!audioManagerRef.current) return;
    // audioManagerRef.current.seek(newPosition);
    setPosition(newPosition);
  };
  
  return (
    <Card>
      <CardActionArea href={`/book/${bookData.uuid}`}>
        <CardHeader subheader={bookData.data.title} />
      </CardActionArea>
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
        <Box sx={{borderRadius: 2, overflow: 'hidden', height: '250px'}}>
          <BookCoverImage bookId={bookData.uuid} />
        </Box>
        </Box>
        <PlayerProgress
          position={position}
          setPosition={handleSeek}
          duration={duration}
          totalLength={totalLength}
          chapterTitle={bookData.data.nav[parseInt(params.order)].label}
        />
        <audio ref={audioRef} />
        <PlayerControls isPlaying={isPlaying} handlePlayPause={handlePlayPause} />
      </CardContent>
      <PlayerCardActions bookData={bookData} />
    </Card>
  );
}