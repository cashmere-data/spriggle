import { IBlockJob, IResponse, JobStatus } from "@/lib/types";
import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { checkDependencies, IJobResults, jobRouter } from "./helpers";

export const POST = async (req: NextRequest): Promise<NextResponse<IResponse>> => {

  const body = await req.json();
  const sb = await createClient();
  const baseUrl = req.nextUrl.origin;

  const {data: jobs, error} = await sb.from('jobs').select('*').in('id', body);

  // process all of the jobs, but make sure all jobs are handled together before providing a response
  const processedJobs: IJobResults[] = await Promise.all((jobs || []).map(async (job: IBlockJob) => {
    if(job.status !== JobStatus.PENDING) {
      return {
        job,
        requestStatus: 'failed',
        message: `Job is not ready to be processed. Current status: ${job.status}`,
      };
    }
    
    const ready = await checkDependencies(job, sb);
    
    if(!ready) {
      return {
        job,
        requestStatus: 'failed',
        message: 'Dependencies are not completed',
      };
    } else {
      // update job status to "processing"
      const updatedJob: IBlockJob = {
        ...job,
        status: JobStatus.PROCESSING,
        log: [
          ...job.log,
          {
            timestamp: new Date().toISOString(),
            message: `Job started processing`,
          },
        ],
      };
      
      await fetch(`${baseUrl}/api/jobs`, {
        method: 'PUT',
        body: JSON.stringify(updatedJob),
      });
      
      return jobRouter(updatedJob, baseUrl);
    }
  }));

  return NextResponse.json({message: 'Hello, World!', data: processedJobs});
}