import { promises as fs } from 'fs';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';


// Function to fetch and parse job details
export default async function getJobDetails(url) {

  try {
    const res = await fetch(url);
    const content = await res.text();
    if (content) {
      const $ = cheerio.load(content);

      // Extract job details using appropriate selectors and clean up
      const Job_Title = $(".top-card-layout__title").text().trim();
      const Company_Name = $(".topcard__org-name-link").text().trim();
      let Job_Location = $(".topcard__flavor--bullet").text().trim().replace(/\n/g, '').replace(/\s\s+/g, ' ');
      let Job_Description = $(".show-more-less-html__markup--clamp-after-5").text().trim().replace(/\n/g, '').replace(/\s\s+/g, ' ');
      const Post_Date = $(".posted-time-ago__text").text().trim();
      const Num_Applicants = $(".num-applicants__caption").text().trim().replace(/\n/g, '').replace(/\s\s+/g, ' ');
      let  Industry = $(".description__job-criteria-list").text().trim().replace(/\n/g, '').replace(/\s\s+/g, ' ');


      // Remove any duplicate parts from Job_Description
      Job_Description = Job_Description.replace(/(?:.*?)(We are looking for a Customer Service Rep to be part of our team\.)/, '$1').trim();

      // Remove the "Over 200 applicants" part from Job_Location
      Job_Location = Job_Location.replace(/Over \d+ applicants/, '').trim();

      Industry = '';
      const criteriaList = $(".description__job-criteria-list li");
      if (criteriaList.length >= 4) {
        const fourthLi = $(criteriaList[3]); // Index 3 for the fourth <li>
        const span = fourthLi.find('span'); // Select the span within this <li>
        Industry = span.text().trim(); // Extract text from the span
      }
      // Extract commented out application link from the <code> element
      const applicationCode = $("#applyUrl").html();
      let Application_Link = '';
      if (applicationCode) {
        const match = applicationCode.match(/<!--(.*?)-->/);
        if (match) {
          Application_Link = match[1].trim();
        }
      }
      else{
        Application_Link = url
      }

      // Create job details object
      const jobDetails = {
        Job_Title,
        Company_Name,
        Job_Location,
        Job_Description,
        Post_Date,
        Num_Applicants,
        Industry,
        Application_Link
      };

      // Write the extracted details to a file
      await fs.writeFile('./JSON/jobDetails.json', JSON.stringify(jobDetails, null, 2));
      console.log('Job details saved to ./JSON/jobDetails.json');

      // Return the job details
      return jobDetails;
    }
  } catch (err) {
    console.error('Error fetching the URL:', err);
  }
}
