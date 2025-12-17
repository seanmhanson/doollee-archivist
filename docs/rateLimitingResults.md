# Rate Limiting Assessment

To ensure data scraping of the site does not contribute to excessive load or servicer performance, simple tests were run to estimate the necessary delays among requests; this information was not provided in response headers, these are best estimates.

## Procedure

A set of eight urls were selected to have comprable data and unique directories. A set of six delay lengths were selected between 3000ms and 500ms. 

The set of urls were pinged in succession, with a given delay between each, and response times and statuses were recorded. 

After a ten second delay, the set was pinged agani with the next of the delay lengths being tested.

After completion, the test was repeated two more times after several minute delays between each. 

## Results

In general, there was no significant difference between delays of 2000ms thorugh 500ms, excluding the outlier of the first ping of each test, which 
had a longer than average time and likely was because of a lack of any cached data; the scraping of data is intended to be done in bundles, and this
is not a concern as a result.

Excluding the 3000ms values, the average standard deviation for a given delay was 53.44ms, and the standard error of means was 10.90ms, all of which suggests there is no meaningful improvement between a 2000ms and a 500ms delay, or any in between values. In this way, a **500ms** delay presented no concerns.

## Implementation Notes

500ms was set as a lower bound for the delay in the scraping, to avoid any unneccessary traffic concerns or burden on the servers. Two requests per second is reasonable, but to ensure adequate distribution of load and to minimize overall need:
- scripts for authors and plays are optimized to evaluate in-browser for all dom requests at once, and in node for handling of the data; this greatly reduces the duration of
the script executions and allows for a higher tolerance for longer network requests
- script executions will be bundled for report, execution, and error handling, and the bundles can also be run at delays
- alternatively, bundles could be run in parallel with web workers or other approaches, at which time we can use this data to judge the change in efficiency vs. the change in load

## Data 

The aggregated statistics across the three tests is presented below:

| Delay  | Count | Min | Max | Median | Average | Stdev | Variance | Std Error |
| ------ | --- | --- | --- | ----- | ----  | -----  | -------- | ------ | 
| 3000ms |  24 | 186 | 845 | 284.5 | 310.1 | 136.67 | 18679.07 | 27.90 | 
| 2000ms |  24 | 182 | 322 | 256   | 252.8 | 50.56  | 2556.28  | 10.32 | 
| 1500ms |  24 | 167 | 327 | 261   | 252.0 | 53.39  | 2850.65  | 10.90 | 
| 1000ms |  24 | 168 | 338 | 256   | 249.8 | 56.20  | 3158.61  | 11.47 | 
|  750ms |  24 | 176 | 320 | 261.5 | 251.2 | 53.29  | 2840.09  | 10.88 | 
|  500ms |  24 | 176 | 324 | 254.5 | 251.3 | 53.73  | 2887.09  | 10.98 | 

The individual test results and statistics are available below:

<summary>
Test 1 of 3
<details>
<table>
<thead>
<tr><th>Duration</th><th colspan="8">Response Times</th><th>Count</th><th>Min</th><th>Max</th><th>Median</th><th>Average</th><th>Stdev</th><th>Variance</th></tr>
</thead>
<tbody>
<tr><td>3000ms</td><td>490</td><td>198</td><td>324</td><td>186</td><td>307</td><td>277</td><td>267</td><td>296</td>	<td>8</td><td>186</td><td>490</td><td>286.5</td><td>293.1</td><td>93.64</td><td>8768.70</td></tr>
<tr><td>2000ms</td><td>207</td><td>199</td><td>322</td><td>199</td><td>320</td><td>255</td><td>263</td><td>305</td>	<td>8</td><td>199</td><td>322</td><td>259.0</td><td>258.8</td><td>53.11</td><td>2820.21</td></tr>
<tr><td>1500ms</td><td>193</td><td>179</td><td>305</td><td>193</td><td>320</td><td>262</td><td>260</td><td>296</td>	<td>8</td><td>179</td><td>320</td><td>261.0</td><td>251.0</td><td>55.83</td><td>3116.57</td></tr>
<tr><td>1000ms</td><td>182</td><td>168</td><td>309</td><td>173</td><td>300</td><td>265</td><td>251</td><td>294</td>	<td>8</td><td>168</td><td>309</td><td>258.0</td><td>242.8</td><td>59.76</td><td>3571.36</td></tr>
<tr><td>750ms</td><td>182</td><td>190</td><td>310</td><td>177</td><td>309</td><td>269</td><td>260</td><td>304</td>	<td>8</td><td>177</td><td>310</td><td>264.5</td><td>250.1</td><td>58.57</td><td>3430.13</td></tr>
<tr><td>500ms</td><td>176</td><td>187</td><td>312</td><td>180</td><td>305</td><td>252</td><td>264</td><td>308</td>	<td>8</td><td>176</td><td>312</td><td>258.0</td><td>248.0</td><td>59.46</td><td>3535.14</td></tr>

</details>
</summary>

<summary>
Test (2 of 3)																
<details>

<table>
<thead>
<tr><th>Duration</th><th colspan="8">Response Times</th><th>Count</th><th>Min</th><th>Max</th><th>Median</th><th>Average</th><th>Stdev</th><th>Variance</th></tr>
</thead>
<tbody>
<tr><td>3000ms</td><td>487</td><td>247</td><td>323</td><td>195</td><td>312</td><td>273</td><td>257</td><td>304</td>	<td>8</td><td>195</td><td>487</td><td>288.5</td><td>299.8</td><td>86.25</td><td>7438.50</td></tr>
<tr><td>2000ms</td><td>200</td><td>188</td><td>311</td><td>182</td><td>311</td><td>257</td><td>247</td><td>301</td>	<td>8</td><td>182</td><td>311</td><td>252.0</td><td>249.6</td><td>54.86</td><td>3009.70</td></tr>
<tr><td>1500ms</td><td>167</td><td>178</td><td>327</td><td>188</td><td>307</td><td>269</td><td>260</td><td>293</td>	<td>8</td><td>167</td><td>327</td><td>264.5</td><td>248.6</td><td>62.55</td><td>3912.84</td></tr>
<tr><td>1000ms</td><td>179</td><td>186</td><td>313</td><td>177</td><td>314</td><td>247</td><td>253</td><td>302</td>	<td>8</td><td>177</td><td>314</td><td>250.0</td><td>246.4</td><td>59.94</td><td>3592.55</td></tr>
<tr><td>750ms</td><td>176</td><td>191</td><td>309</td><td>180</td><td>299</td><td>251</td><td>263</td><td>285</td>	<td>8</td><td>176</td><td>309</td><td>257.0</td><td>244.3</td><td>54.60</td><td>2981.36</td></tr>
<tr><td>500ms</td><td>186</td><td>187</td><td>301</td><td>192</td><td>314</td><td>252</td><td>246</td><td>303</td>	<td>8</td><td>186</td><td>314</td><td>249.0</td><td>247.6</td><td>54.65</td><td>2987.13</td></tr>
</tbody>
</table>
</details>
</summary>

<summary>
Test (<td>3</td>of 3)		
<details>

<table>
<thead>
<tr><th>Duration</th><th colspan="8">Response Times</th><th>Count</th><th>Min</th><th>Max</th><th>Median</th><th>Average</th><th>Stdev</th><th>Variance</th></tr>
</thead>
<tbody>
<tr><td>3000ms</td><td>845</td><td>216</td><td>314</td><td>195</td><td>312</td><td>262</td><td>264</td><td>292</td>	<td>8</td><td>195</td><td>845</td><td>278.0</td><td>337.5</td><td>209.42</td><td>43857.14</td></tr>
<tr><td>2000ms</td><td>194</td><td>191</td><td>303</td><td>198</td><td>307</td><td>253</td><td>257</td><td>296</td>	<td>8</td><td>191</td><td>307</td><td>255.0</td><td>249.9</td><td>50.08</td><td>2507.55</td></tr>
<tr><td>1500ms</td><td>212</td><td>205</td><td>309</td><td>196</td><td>306</td><td>254</td><td>263</td><td>307</td>	<td>8</td><td>196</td><td>309</td><td>258.5</td><td>256.5</td><td>47.96</td><td>2299.71</td></tr>
<tr><td>1000ms</td><td>206</td><td>201</td><td>338</td><td>194</td><td>312</td><td>275</td><td>259</td><td>297</td>	<td>8</td><td>194</td><td>338</td><td>267.0</td><td>260.3</td><td>54.95</td><td>3019.36</td></tr>
<tr><td>750ms</td><td>202</td><td>196</td><td>320</td><td>202</td><td>314</td><td>276</td><td>260</td><td>304</td>	<td>8</td><td>196</td><td>320</td><td>268.0</td><td>259.3</td><td>52.82</td><td>2789.64</td></tr>
<tr><td>500ms</td><td>186</td><td>210</td><td>324</td><td>200</td><td>312</td><td>279</td><td>257</td><td>298</td>	<td>8</td><td>186</td><td>324</td><td>268.0</td><td>258.3</td><td>53.67</td><td>2880.79</td></tr>
</tbody>
</table>
</details>
</summary>