<?php
if (isset($GLOBALS["HTTP_RAW_POST_DATA"]))
{
	function saveImageFromCanvas () {
		// Get the data
		$imageData=$GLOBALS['HTTP_RAW_POST_DATA'];
	
		// Remove the headers (data:,) part.  
		// A real application should use them according to needs such as to check image type
		$filteredData=substr($imageData, strpos($imageData, ",")+1);
	
		// Need to decode before saving since the data we received is already base64 encoded
		$unencodedData=base64_decode($filteredData);
	
		//echo "unencodedData".$unencodedData;
	
		// Save file.  This example uses a hard coded filename for testing, 
		// but a real application can specify filename in POST variable
		$fp = fopen( 'img/harmonogram.png', 'wb' );
		fwrite( $fp, $unencodedData);
		fclose( $fp );
	};
	
	function alphaOverlay($destImg, $overlayImg, $imgW, $imgH)
	{
		for($y=0;$y<$imgH;$y++)
		{
			for($x=0;$x<$imgW;$x++)
			{
				$ovrARGB = imagecolorat($overlayImg, $x, $y);
				$ovrA = ($ovrARGB >> 24) << 1;
				$ovrR = $ovrARGB >> 16 & 0xFF;
				$ovrG = $ovrARGB >> 8 & 0xFF;
				$ovrB = $ovrARGB & 0xFF;
				
				$change = false;
				if($ovrA == 0)
				{
					$dstR = $ovrR;
					$dstG = $ovrG;
					$dstB = $ovrB;
					$change = true;
				}
				elseif($ovrA < 254)
				{
					$dstARGB = imagecolorat($destImg, $x, $y);
					$dstR = $dstARGB >> 16 & 0xFF;
					$dstG = $dstARGB >> 8 & 0xFF;
					$dstB = $dstARGB & 0xFF;
					
					$dstR = (($ovrR * (0xFF-$ovrA)) >> 8) + (($dstR * $ovrA) >> 8);
					$dstG = (($ovrG * (0xFF-$ovrA)) >> 8) + (($dstG * $ovrA) >> 8);
					$dstB = (($ovrB * (0xFF-$ovrA)) >> 8) + (($dstB * $ovrA) >> 8);
					$change = true;
				}
				if($change)
				{
					$dstRGB = imagecolorallocatealpha($destImg, $dstR, $dstG, $dstB, 0);
					imagesetpixel($destImg, $x, $y, $dstRGB);
				}
					
			}
		}
		return $destImg;
	};

	// Transparent image needs background
	function mergeImageWithBackground () {
		// Create image instances
		$src = imagecreatefrompng('img/harmonogram.png');
		$dest = imagecreatefrompng('img/bg.png');
		
		// Copy
		//imagecopymerge($dest, $src, 0, 0, 0, 0, 800, 600, 100);
		$dest = alphaOverlay($dest, $src, 800, 600);
		
		// Output and free from memory
		header('Content-Type: image/png');
		imagegif($dest, 'img/harmonogram-'.$_REQUEST[imageId].'.gif');
		
		imagedestroy($dest);
		imagedestroy($src);	
	};
	
	saveImageFromCanvas();
	mergeImageWithBackground();
	
}
?>