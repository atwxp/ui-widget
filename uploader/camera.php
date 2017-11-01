<?php

    function getMillisecond() { 
        list($s1, $s2) = explode(' ', microtime()); 
        return (float)sprintf('%.0f', (floatval($s1) + floatval($s2)) * 1000); 
}
    echo '
    {
        "errCode": 0,
        "data": {
            "time": ' . getMillisecond() . '
        }
    }
    '
?>
