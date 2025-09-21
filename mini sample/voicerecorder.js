import React, { useState, useRef, useCallback } from 'react';
import apiService from '../services/apiService';

const VoiceRecorder = ({ onTranscription }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  const startRecording = useCallback(async () => {
    try {
      // Check if already recording
      if (isRecording || isProcessing) return;
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        try {
          if (audioChunksRef.current.length === 0) {
            throw new Error('No audio data recorded');
          }
          
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          await processAudio(audioBlob);
        } catch (error) {
          console.error('Error in recording stop handler:', error);
          setIsProcessing(false);
        } finally {
          // Clean up
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  }, [isRecording, isProcessing]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  }, [isRecording]);

  const processAudio = async (audioBlob) => {
    try {
      const response = await apiService.transcribeAudio(audioBlob);
      onTranscription(response.transcription);
    } catch (error) {
      console.error('Error processing audio:', error);
      alert('Failed to process audio. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else if (!isProcessing) {
      startRecording();
    }
  };

  // Get appropriate button text and aria label
  const getButtonState = () => {
    if (isProcessing) {
      return { icon: '⏳', label: 'Processing audio...' };
    } else if (isRecording) {
      return { icon: '⏹️', label: 'Stop recording' };
    } else {
      return { icon: '🎤', label: 'Start recording' };
    }
  };

  const { icon, label } = getButtonState();

  return (
    <button
      className={`voice-btn mic ${isRecording ? 'recording' : ''} ${isProcessing ? 'processing' : ''}`}
      onClick={handleClick}
      disabled={isProcessing}
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  );
};

export default VoiceRecorder;