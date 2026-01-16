{
  "method": "POST",
  "url": "https://api.creatomate.com/v1/renders",
  "headers": {
    "Authorization": "Bearer YOUR_API_KEY"
  },
  "body": {
    "template_id": "your_template_id",
    "modifications": {
      "Text-1": "{{ $json.scenes[0].text }}",
      "Video-1": "{{ $json.videoAssets[0].url }}"
    }
  }
}
