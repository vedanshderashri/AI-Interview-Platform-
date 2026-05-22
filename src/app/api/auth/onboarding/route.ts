import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function PATCH(req: Request) {
  try {
    await dbConnect();
    const { userId, ...details } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { ...details, isOnboarded: true },
      { new: true }
    );

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isOnboarded: user.isOnboarded,
          careerGoals: user.careerGoals,
          targetDomains: user.targetDomains,
          experienceLevel: user.experienceLevel,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Onboarding update error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
