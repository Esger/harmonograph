<?php 
if (isset($_REQUEST[imageId])) {
	$imageId = $_REQUEST[imageId];
}

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
		$dest = imagecreatefrompng('img/bg-black.png');
		
		// Copy
		//imagecopymerge($dest, $src, 0, 0, 0, 0, 800, 600, 100);
		$dest = alphaOverlay($dest, $src, 800, 600);
		
		// Output and free from memory
		header('Content-Type: image/gif');
		imagegif($dest, 'img/harmonogram-'.$_REQUEST[imageId].'.gif');
		
		imagedestroy($dest);
		imagedestroy($src);	
	};
	
	saveImageFromCanvas();
	mergeImageWithBackground();
	
}

echo '
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
	<meta name="description" content="Interactive Harmonograph - Create your own artwork!">
	<meta property="og:url" content="http://www.ashware.nl/harmonograph/your-harmonogram-snapshot.php?imageId='.$imageId.'" />
	<meta property="og:title" content="This is my creation... what\'s yours?"/>
	<meta property="og:image" content="http://www.ashware.nl/harmonograph/img/harmonogram-'.$imageId.'.gif" />
	<meta property="og:description" content="Interactive Harmonograph - Create your own artwork!" />
	<link rel="image_src" href="http://www.ashware.nl/harmonograph/img/harmonogram-'.$imageId.'.gif" />
	<title>Create your own harmonogram and share it...</title>
	<style>
		body{
			height:100%;
			background-color:#000;
		}
		h1{
			font:bold 21px / 21px "Trebuchet MS", Arial, Helvetica, sans-serif;
			text-align:center;
		}
		h1 a{
			color:#cc0;
		}
		img{
			display:block;
			position:relative;
			margin:20px auto;
		}
		.addThis{
			position:fixed; 
			left:0; top:0;
		}
	</style>
	<script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.7/jquery.min.js"></script>
</head>

<body>
	<h1><a href="http://www.ashware.nl/harmonograph">Create your own harmonogram here</a></h1>
	<img class="harmonogram" src="img/harmonogram-'.$imageId.'.gif" alt="mijn harmonogram" />
	<div class="addThis">
		<!-- AddThis Button BEGIN -->
		<div class="addthis_toolbox addthis_default_style ">
			<a class="addthis_counter addthis_pill_style"></a>
		</div>
		<script type="text/javascript" src="http://s7.addthis.com/js/250/addthis_widget.js#pubid=ra-4f3c4b976815089f"></script>
		<!-- AddThis Button END -->
	</div>
	
<script type="text/javascript" >
$(function(){
	$(".harmonogram").css("marginTop",($(document).innerHeight()-600)/2);
});
	
</script>
</body>
</html>'; 
?>