"""
Calls Amazon Bedrock to turn structured overlap data into the specific,
human-sounding notification text — this is the one piece of the pipeline
that's actually generative AI, deliberately kept separate from the
matching math itself.

NOTE: swap MODEL_ID for whatever's enabled in your team's AWS account
(Bedrock model access has to be explicitly enabled per-account/region).
Claude 3 Haiku is a good default for a hackathon: fast and cheap, and
this task doesn't need a large model.
"""

import json
import boto3

bedrock = boto3.client("bedrock-runtime")

MODEL_ID = "us.anthropic.claude-sonnet-4-5-20250929-v1:0"


def generate_match_explanation(user_a: dict, user_b: dict, overlap_result: dict) -> str:
    """
    user_a, user_b: dicts from the Users table (home_area, destination, etc.)
    overlap_result: the dict returned by score_overlap()

    Returns a short natural-language string like:
    "You and Alex have shared this commute 4 times this week — you're
    both usually on the 99 around 8:15, and you're both heading to Sauder."
    """
    prompt = f"""You generate a single short, warm, specific notification for a
commute-matching app called Commutity. Two users have been detected sharing
a recurring commute pattern.

User A destination: {user_a.get("destination", "campus")}
User B destination: {user_b.get("destination", "campus")}
Overlap ratio: {overlap_result["overlap_ratio"]}
Shared location checkpoints: {overlap_result["shared_cells"]}

Write ONE sentence, from User A's point of view, referring to User B only
as "them" (do not invent a name). Be specific and concrete about the
overlap, not generic. Do not use the words "match" or "algorithm."
Output ONLY the sentence, nothing else."""

    response = bedrock.invoke_model(
        modelId=MODEL_ID,
        body=json.dumps(
            {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 100,
                "messages": [{"role": "user", "content": prompt}],
            }
        ),
    )

    result = json.loads(response["body"].read())
    return result["content"][0]["text"].strip()


if __name__ == "__main__":
    # Local test — requires AWS credentials configured with Bedrock access
    fake_user_a = {"destination": "Sauder"}
    fake_user_b = {"destination": "Sauder"}
    fake_overlap = {"overlap_ratio": 1.0, "shared_cells": 4}

    print(generate_match_explanation(fake_user_a, fake_user_b, fake_overlap))
