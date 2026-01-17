import { Config } from '@remotion/cli/config';

// Performance optimizations for Render.com free tier
Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setConcurrency(1); // Low memory mode
Config.setChromiumDisableWebSecurity(true);
Config.setChromiumHeadlessMode(true);

// Quality settings
Config.setQuality(80); // Good balance of quality/speed

// Timeouts
Config.setTimeoutInMilliseconds(300000); // 5 minutes

export default Config;
